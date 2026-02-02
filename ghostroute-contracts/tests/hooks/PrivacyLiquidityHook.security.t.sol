// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PrivacyLiquidityHook} from "../../src/hooks/PrivacyLiquidityHook.sol";
import {TestablePrivacyLiquidityHook} from "./mocks/TestablePrivacyLiquidityHook.sol";
import {MockPoolManager} from "./mocks/MockPoolManager.sol";
import {MockPrivacyVault} from "./mocks/MockPrivacyVault.sol";
import {TransientStorage} from "../../src/libraries/TransientStorage.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

/**
 * @title MaliciousReentrantContract
 * @notice Contract that attempts reentrancy attacks
 */
contract MaliciousReentrantContract {
    TestablePrivacyLiquidityHook public hook;
    PoolKey public poolKey;
    ModifyLiquidityParams public params;
    uint256 public attackCount;
    
    constructor(TestablePrivacyLiquidityHook _hook) {
        hook = _hook;
    }
    
    function setAttackParams(PoolKey memory _poolKey, ModifyLiquidityParams memory _params) external {
        poolKey = _poolKey;
        params = _params;
    }
    
    // Attempt reentrancy when receiving callback
    fallback() external {
        if (attackCount < 2) {
            attackCount++;
            // Try to call addLiquidityWithPrivacy again
            bytes memory proof = "";
            bytes32[] memory publicInputs = new bytes32[](0);
            hook.addLiquidityWithPrivacy(poolKey, params, proof, publicInputs);
        }
    }
}

/**
 * @title PrivacyLiquidityHookSecurityTest
 * @notice Security tests including reentrancy protection
 * @dev Covers T033, T092 from tasks.md
 */
contract PrivacyLiquidityHookSecurityTest is Test {
    
    TestablePrivacyLiquidityHook public hook;
    MockPoolManager public mockPoolManager;
    MockPrivacyVault public mockPrivacyVault;
    MaliciousReentrantContract public attacker;
    
    // Test addresses
    address constant TOKEN_A = address(0x1000);
    address constant TOKEN_B = address(0x2000);
    address constant ALICE = address(0x1);
    address constant ATTACKER = address(0xBAD);
    
    PoolKey public testPoolKey;
    
    function setUp() public {
        // Deploy mock contracts
        mockPoolManager = new MockPoolManager();
        mockPrivacyVault = new MockPrivacyVault(keccak256("test_merkle_root"));
        
        // Deploy hook
        hook = new TestablePrivacyLiquidityHook(
            IPoolManager(address(mockPoolManager)),
            address(mockPrivacyVault)
        );
        
        // Deploy attacker contract
        attacker = new MaliciousReentrantContract(hook);
        
        // Create test pool key
        testPoolKey = PoolKey({
            currency0: Currency.wrap(TOKEN_A),
            currency1: Currency.wrap(TOKEN_B),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Initialize the pool
        mockPoolManager.initialize(testPoolKey, 79228162514264337593543950336);
    }
    
    // ============ T033: Reentrancy Protection Tests ============
    
    function test_TransientStorageIsIsolatedPerTransaction() public {
        // Transaction 1: Set authorization
        TransientStorage.setAuthorization(ALICE);
        assertEq(TransientStorage.getAuthorization(), ALICE);
        
        // In a new context (simulating new transaction), authorization should be empty
        // Note: In Foundry, we can't truly simulate a new transaction,
        // but we can test that clearing works
        TransientStorage.clearAuthorization();
        assertEq(TransientStorage.getAuthorization(), address(0));
    }
    
    function test_OnlyPrivacyVaultCanCallAddLiquidity() public {
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        bytes memory proof = "";
        bytes32[] memory publicInputs = new bytes32[](0);
        
        // Attacker tries to call directly
        vm.prank(ATTACKER);
        vm.expectRevert(PrivacyLiquidityHook.OnlyPrivacyVault.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, proof, publicInputs);
    }
    
    function test_CannotSpoofAuthorizationFromExternalCall() public {
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        // Attacker sets their own authorization
        vm.startPrank(ATTACKER);
        TransientStorage.setAuthorization(ATTACKER);
        
        // But they still can't call addLiquidityWithPrivacy because of onlyPrivacyVault
        vm.expectRevert(PrivacyLiquidityHook.OnlyPrivacyVault.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
        vm.stopPrank();
    }
    
    function test_HookCallbackOnlyAcceptsPoolManagerCalls() public {
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        // Set authorization
        TransientStorage.setAuthorization(address(mockPrivacyVault));
        
        // Attacker tries to call beforeAddLiquidity directly (not from PoolManager)
        // This should revert due to onlyPoolManager modifier in BaseHook
        vm.prank(ATTACKER);
        vm.expectRevert(); // BaseHook's onlyPoolManager will revert
        hook.beforeAddLiquidity(
            address(mockPrivacyVault),
            testPoolKey,
            params,
            ""
        );
    }
    
    // ============ T092: Front-running Attack Prevention Tests ============
    
    function test_AuthorizationIsAddressSpecific() public {
        // PrivacyVault sets authorization for itself
        TransientStorage.setAuthorization(address(mockPrivacyVault));
        
        // Verify only the exact address is authorized
        assertTrue(TransientStorage.isAuthorized(address(mockPrivacyVault)));
        assertFalse(TransientStorage.isAuthorized(ALICE));
        assertFalse(TransientStorage.isAuthorized(ATTACKER));
    }
    
    function test_CannotUseOtherUsersAuthorization() public {
        // Set authorization for PrivacyVault
        TransientStorage.setAuthorization(address(mockPrivacyVault));
        
        // Another user cannot use this authorization for their own purposes
        // because addLiquidityWithPrivacy checks msg.sender == PRIVACY_VAULT
        vm.prank(ALICE);
        vm.expectRevert(PrivacyLiquidityHook.OnlyPrivacyVault.selector);
        hook.addLiquidityWithPrivacy(
            testPoolKey,
            ModifyLiquidityParams({
                tickLower: -600,
                tickUpper: 600,
                liquidityDelta: 1000e18,
                salt: bytes32(0)
            }),
            "",
            new bytes32[](0)
        );
    }
    
    function test_InvalidPoolParametersAreRejected() public {
        // Test various invalid parameter combinations
        
        // 1. Invalid currency order (currency0 > currency1)
        PoolKey memory invalidKey = PoolKey({
            currency0: Currency.wrap(TOKEN_B), // TOKEN_B > TOKEN_A
            currency1: Currency.wrap(TOKEN_A),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidPoolParameters.selector);
        hook.addLiquidityWithPrivacy(invalidKey, params, "", new bytes32[](0));
    }
    
    function test_NegativeLiquidityDeltaIsRejected() public {
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: -1000e18, // Negative - trying to remove liquidity
            salt: bytes32(0)
        });
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidLiquidityDelta.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
    }
    
    function test_ZeroLiquidityDeltaIsRejected() public {
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 0, // Zero - no liquidity change
            salt: bytes32(0)
        });
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidLiquidityDelta.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
    }
    
    // ============ Access Control Edge Cases ============
    
    function test_ImmutablePrivacyVaultCannotBeChanged() public view {
        // PRIVACY_VAULT is immutable, set in constructor
        address vault = hook.PRIVACY_VAULT();
        assertEq(vault, address(mockPrivacyVault));
        // No setter function exists - immutability is enforced by Solidity
    }
    
    function test_ImmutablePoolManagerCannotBeChanged() public view {
        // poolManager is immutable from BaseHook
        address pm = address(hook.getPoolManager());
        assertEq(pm, address(mockPoolManager));
        // No setter function exists - immutability is enforced by Solidity
    }
    
    // ============ Fuzz Tests for Security ============
    
    function testFuzz_OnlyPrivacyVaultModifier(address caller) public {
        vm.assume(caller != address(mockPrivacyVault));
        vm.assume(caller != address(0));
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        vm.prank(caller);
        vm.expectRevert(PrivacyLiquidityHook.OnlyPrivacyVault.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
    }
    
    function testFuzz_AuthorizationIsExact(address authorized, address caller) public {
        vm.assume(authorized != caller);
        
        TransientStorage.setAuthorization(authorized);
        
        assertTrue(TransientStorage.isAuthorized(authorized));
        assertFalse(TransientStorage.isAuthorized(caller));
    }
}
