// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PrivacyLiquidityHook} from "../../src/hooks/PrivacyLiquidityHook.sol";
import {TestablePrivacyLiquidityHook} from "./mocks/TestablePrivacyLiquidityHook.sol";
import {MockPoolManager} from "./mocks/MockPoolManager.sol";
import {MockPrivacyVault} from "./mocks/MockPrivacyVault.sol";
import {TestUtils} from "../utils/TestUtils.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

/**
 * @title PrivacyLiquidityHookTest
 * @notice Basic test suite for PrivacyLiquidityHook
 * @dev Verifies hook deployment, permissions, and basic functionality
 */
contract PrivacyLiquidityHookTest is Test, TestUtils {
    
    TestablePrivacyLiquidityHook public hook;
    MockPoolManager public mockPoolManager;
    MockPrivacyVault public mockPrivacyVault;
    
    // Test pool parameters
    PoolKey public testPoolKey;
    
    // Helper to create PoolKey
    function createPoolKey(
        address token0,
        address token1,
        uint24 fee,
        int24 tickSpacing,
        IHooks hooks
    ) internal pure returns (PoolKey memory) {
        return PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: hooks
        });
    }
    
    // Helper to create ModifyLiquidityParams
    function createLiquidityParams(
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta,
        bytes32 salt
    ) internal pure returns (ModifyLiquidityParams memory) {
        return ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: liquidityDelta,
            salt: salt
        });
    }
    
    function setUp() public {
        // Deploy mock contracts
        mockPoolManager = new MockPoolManager();
        mockPrivacyVault = new MockPrivacyVault(createTestMerkleRoot());
        
        // Deploy hook (testable version that skips address validation)
        hook = new TestablePrivacyLiquidityHook(
            IPoolManager(address(mockPoolManager)),
            address(mockPrivacyVault)
        );
        
        // Create test pool key
        testPoolKey = createPoolKey(
            TOKEN_A,
            TOKEN_B,
            3000, // 0.3% fee
            60,   // tick spacing
            IHooks(address(hook))
        );
        
        // Initialize the pool
        mockPoolManager.initialize(testPoolKey, 79228162514264337593543950336); // sqrtPriceX96 for 1:1
        
        // Setup test accounts
        setupTestAccounts();
    }
    
    function test_Deployment() public {
        assertEq(address(hook.getPoolManager()), address(mockPoolManager), "PoolManager mismatch");
        assertEq(hook.PRIVACY_VAULT(), address(mockPrivacyVault), "PrivacyVault mismatch");
    }
    
    function test_ComputeActionHash() public {
        ModifyLiquidityParams memory params = createLiquidityParams(
            -600,
            600,
            1000e18,
            bytes32(0)
        );
        
        bytes32 actionHash = hook.computeActionHash(testPoolKey, params, ALICE);
        
        // Hash should be non-zero
        assertTrue(actionHash != bytes32(0), "Action hash should not be zero");
        
        // Hash should be deterministic
        bytes32 actionHash2 = hook.computeActionHash(testPoolKey, params, ALICE);
        assertEq(actionHash, actionHash2, "Action hash should be deterministic");
        
        // Different recipient should produce different hash
        bytes32 actionHash3 = hook.computeActionHash(testPoolKey, params, BOB);
        assertTrue(actionHash != actionHash3, "Different recipient should produce different hash");
    }
    
    function test_OnlyPrivacyVaultCanAddLiquidity() public {
        ModifyLiquidityParams memory params = createLiquidityParams(
            -600,
            600,
            1000e18,
            bytes32(0)
        );
        
        bytes memory proof = createMockProof();
        bytes32[] memory publicInputs = createMockPublicInputs(
            hook.computeActionHash(testPoolKey, params, address(mockPrivacyVault))
        );
        
        // Try to call from non-vault address (should revert)
        vm.prank(ALICE);
        vm.expectRevert(PrivacyLiquidityHook.OnlyPrivacyVault.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, proof, publicInputs);
    }
    
    function test_InvalidPoolParametersRevert() public {
        // Create pool key with invalid currency order
        PoolKey memory invalidKey = PoolKey({
            currency0: Currency.wrap(TOKEN_B), // Wrong order
            currency1: Currency.wrap(TOKEN_A),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        ModifyLiquidityParams memory params = createLiquidityParams(
            -600,
            600,
            1000e18,
            bytes32(0)
        );
        
        bytes memory proof = createMockProof();
        bytes32[] memory publicInputs = new bytes32[](0);
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidPoolParameters.selector);
        hook.addLiquidityWithPrivacy(invalidKey, params, proof, publicInputs);
    }
    
    function test_InvalidLiquidityDeltaRevert() public {
        // Try to remove liquidity (negative delta)
        ModifyLiquidityParams memory params = createLiquidityParams(
            -600,
            600,
            -1000e18, // Negative (removing)
            bytes32(0)
        );
        
        bytes memory proof = createMockProof();
        bytes32[] memory publicInputs = new bytes32[](0);
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidLiquidityDelta.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, proof, publicInputs);
    }
}
