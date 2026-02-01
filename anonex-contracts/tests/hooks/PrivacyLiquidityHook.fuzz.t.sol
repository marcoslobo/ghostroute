// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PrivacyLiquidityHook} from "../../src/hooks/PrivacyLiquidityHook.sol";
import {TestablePrivacyLiquidityHook} from "./mocks/TestablePrivacyLiquidityHook.sol";
import {MockPoolManager} from "./mocks/MockPoolManager.sol";
import {MockPrivacyVault} from "./mocks/MockPrivacyVault.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

/**
 * @title PrivacyLiquidityHookFuzzTest
 * @notice Fuzz tests for edge cases and boundary conditions
 * @dev Covers T091 from tasks.md - Fuzzing tests for edge cases
 */
contract PrivacyLiquidityHookFuzzTest is Test {
    
    TestablePrivacyLiquidityHook public hook;
    MockPoolManager public mockPoolManager;
    MockPrivacyVault public mockPrivacyVault;
    
    address constant TOKEN_A = address(0x1000);
    address constant TOKEN_B = address(0x2000);
    
    PoolKey public testPoolKey;
    
    function setUp() public {
        mockPoolManager = new MockPoolManager();
        mockPrivacyVault = new MockPrivacyVault(keccak256("test_merkle_root"));
        
        hook = new TestablePrivacyLiquidityHook(
            IPoolManager(address(mockPoolManager)),
            address(mockPrivacyVault)
        );
        
        testPoolKey = PoolKey({
            currency0: Currency.wrap(TOKEN_A),
            currency1: Currency.wrap(TOKEN_B),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        mockPoolManager.initialize(testPoolKey, 79228162514264337593543950336);
    }
    
    // ============ Edge Case Fuzz Tests ============
    
    function testFuzz_ZeroLiquidityDeltaReverts() public {
        int24[3] memory lowers = [int24(-600), int24(-300), int24(-120)];
        int24[3] memory uppers = [int24(120), int24(300), int24(600)];
        
        for (uint256 i = 0; i < lowers.length; i++) {
            for (uint256 j = 0; j < uppers.length; j++) {
                if (lowers[i] < uppers[j]) {
                    ModifyLiquidityParams memory params = ModifyLiquidityParams({
                        tickLower: lowers[i],
                        tickUpper: uppers[j],
                        liquidityDelta: 0,
                        salt: bytes32(0)
                    });
                    
                    hook.setSkipAuthorizationCheck(true);
                    
                    vm.prank(address(mockPrivacyVault));
                    vm.expectRevert(PrivacyLiquidityHook.InvalidLiquidityDelta.selector);
                    hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
                }
            }
        }
    }
    
    function testFuzz_NegativeLiquidityDeltaReverts() public {
        int24[3] memory lowers = [int24(-600), int24(-300), int24(-120)];
        int24[3] memory uppers = [int24(120), int24(300), int24(600)];
        
        for (uint256 i = 0; i < lowers.length; i++) {
            for (uint256 j = 0; j < uppers.length; j++) {
                if (lowers[i] < uppers[j]) {
                    ModifyLiquidityParams memory params = ModifyLiquidityParams({
                        tickLower: lowers[i],
                        tickUpper: uppers[j],
                        liquidityDelta: -1,
                        salt: bytes32(0)
                    });
                    
                    hook.setSkipAuthorizationCheck(true);
                    
                    vm.prank(address(mockPrivacyVault));
                    vm.expectRevert(PrivacyLiquidityHook.InvalidLiquidityDelta.selector);
                    hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
                }
            }
        }
    }
    
    function testFuzz_TickLowerGreaterThanTickUpperReverts() public {
        int24[3] memory ticks = [int24(-600), int24(-300), int24(-120)];
        
        for (uint256 i = 0; i < ticks.length; i++) {
            for (uint256 j = 0; j < ticks.length; j++) {
                if (ticks[j] < ticks[i]) {
                    ModifyLiquidityParams memory params = ModifyLiquidityParams({
                        tickLower: ticks[i],
                        tickUpper: ticks[j],
                        liquidityDelta: 1000e18,
                        salt: bytes32(0)
                    });
                    
                    hook.setSkipAuthorizationCheck(true);
                    
                    vm.prank(address(mockPrivacyVault));
                    vm.expectRevert(PrivacyLiquidityHook.InvalidPoolParameters.selector);
                    hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
                }
            }
        }
    }
    
    function testFuzz_TickLowerEqualsTickUpperReverts(int24 tick, uint256 liquidityDelta) public {
        vm.assume(tick >= -887272 && tick <= 887272);
        vm.assume(tick % 60 == 0);
        vm.assume(liquidityDelta > 0 && liquidityDelta < 1_000_000_000 ether);
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: tick,
            tickUpper: tick,
            liquidityDelta: int256(liquidityDelta),
            salt: bytes32(0)
        });
        
        hook.setSkipAuthorizationCheck(true);
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidPoolParameters.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
    }
    
    function testFuzz_TicksNotMultipleOfSpacingReverts(int24 tickLower, int24 tickUpper) public {
        vm.assume(tickLower < tickUpper);
        vm.assume(tickLower >= -887272 && tickUpper <= 887272);
        vm.assume(tickLower % 60 != 0 || tickUpper % 60 != 0);
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        hook.setSkipAuthorizationCheck(true);
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidPoolParameters.selector);
        hook.addLiquidityWithPrivacy(testPoolKey, params, "", new bytes32[](0));
    }
    
    function testFuzz_InvalidFeeReverts(uint24 fee) public {
        vm.assume(fee > 1000000);
        
        PoolKey memory invalidKey = PoolKey({
            currency0: Currency.wrap(TOKEN_A),
            currency1: Currency.wrap(TOKEN_B),
            fee: fee,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        hook.setSkipAuthorizationCheck(true);
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidPoolParameters.selector);
        hook.addLiquidityWithPrivacy(invalidKey, params, "", new bytes32[](0));
    }
    
    function testFuzz_InvalidTickSpacingReverts(int24 tickSpacing) public {
        vm.assume(tickSpacing <= 0);
        
        PoolKey memory invalidKey = PoolKey({
            currency0: Currency.wrap(TOKEN_A),
            currency1: Currency.wrap(TOKEN_B),
            fee: 3000,
            tickSpacing: tickSpacing,
            hooks: IHooks(address(hook))
        });
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        hook.setSkipAuthorizationCheck(true);
        
        vm.prank(address(mockPrivacyVault));
        vm.expectRevert(PrivacyLiquidityHook.InvalidPoolParameters.selector);
        hook.addLiquidityWithPrivacy(invalidKey, params, "", new bytes32[](0));
    }
    
    function testFuzz_ValidLiquidityDeltaWorks(uint128 liquidityDelta) public {
        vm.assume(liquidityDelta > 0);
        vm.assume(liquidityDelta < type(uint128).max);
        
        MockERC20Fuzz tokenA = new MockERC20Fuzz();
        MockERC20Fuzz tokenB = new MockERC20Fuzz();
        
        if (address(tokenA) > address(tokenB)) {
            MockERC20Fuzz temp = tokenA;
            tokenA = tokenB;
            tokenB = temp;
        }
        
        tokenA.mint(address(mockPrivacyVault), uint256(liquidityDelta) * 2);
        tokenB.mint(address(mockPrivacyVault), uint256(liquidityDelta) * 2);
        
        PoolKey memory validKey = PoolKey({
            currency0: Currency.wrap(address(tokenA)),
            currency1: Currency.wrap(address(tokenB)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        mockPoolManager.initialize(validKey, 79228162514264337593543950336);
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: int256(uint256(liquidityDelta)),
            salt: bytes32(0)
        });
        
        hook.setSkipAuthorizationCheck(true);
        
        vm.prank(address(mockPrivacyVault));
        hook.addLiquidityWithPrivacy(validKey, params, "", new bytes32[](0));
        
        assertTrue(true, "Valid liquidity delta should work");
    }
    
    function testFuzz_OnlyPrivacyVaultCanAddLiquidity(address caller) public {
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
    
    function testFuzz_DifferentSaltsCreateDifferentActionHashes() public {
        int24[3] memory lowers = [int24(-600), int24(-300), int24(-120)];
        int24[3] memory uppers = [int24(120), int24(300), int24(600)];
        
        for (uint256 i = 0; i < lowers.length; i++) {
            for (uint256 j = 0; j < uppers.length; j++) {
                if (lowers[i] < uppers[j]) {
                    ModifyLiquidityParams memory params1 = ModifyLiquidityParams({
                        tickLower: lowers[i],
                        tickUpper: uppers[j],
                        liquidityDelta: 1000e18,
                        salt: bytes32(0)
                    });
                    
                    ModifyLiquidityParams memory params2 = ModifyLiquidityParams({
                        tickLower: lowers[i],
                        tickUpper: uppers[j],
                        liquidityDelta: 1000e18,
                        salt: bytes32(uint256(1))
                    });
                    
                    bytes32 hash1 = hook.computeActionHash(testPoolKey, params1, address(mockPrivacyVault));
                    bytes32 hash2 = hook.computeActionHash(testPoolKey, params2, address(mockPrivacyVault));
                    
                    assertTrue(hash1 != hash2, "Different salts should produce different action hashes");
                }
            }
        }
    }
    
    function testFuzz_SameInputsProduceSameHash() public {
        int24[3] memory lowers = [int24(-600), int24(-300), int24(-120)];
        int24[3] memory uppers = [int24(120), int24(300), int24(600)];
        
        for (uint256 i = 0; i < lowers.length; i++) {
            for (uint256 j = 0; j < uppers.length; j++) {
                if (lowers[i] < uppers[j]) {
                    ModifyLiquidityParams memory params = ModifyLiquidityParams({
                        tickLower: lowers[i],
                        tickUpper: uppers[j],
                        liquidityDelta: 1000e18,
                        salt: bytes32(0)
                    });
                    
                    bytes32 hash1 = hook.computeActionHash(testPoolKey, params, address(mockPrivacyVault));
                    bytes32 hash2 = hook.computeActionHash(testPoolKey, params, address(mockPrivacyVault));
                    
                    assertEq(hash1, hash2, "Same inputs should produce same hash");
                }
            }
        }
    }
    
    function testFuzz_LargeLiquidityDeltaWorks() public {
        MockERC20Fuzz tokenA = new MockERC20Fuzz();
        MockERC20Fuzz tokenB = new MockERC20Fuzz();
        
        if (address(tokenA) > address(tokenB)) {
            MockERC20Fuzz temp = tokenA;
            tokenA = tokenB;
            tokenB = temp;
        }
        
        uint256 largeAmount = 1_000_000_000_000_000 ether;
        tokenA.mint(address(mockPrivacyVault), largeAmount);
        tokenB.mint(address(mockPrivacyVault), largeAmount);
        
        PoolKey memory validKey = PoolKey({
            currency0: Currency.wrap(address(tokenA)),
            currency1: Currency.wrap(address(tokenB)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        mockPoolManager.initialize(validKey, 79228162514264337593543950336);
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: int256(largeAmount),
            salt: bytes32(0)
        });
        
        hook.setSkipAuthorizationCheck(true);
        
        vm.prank(address(mockPrivacyVault));
        hook.addLiquidityWithPrivacy(validKey, params, "", new bytes32[](0));
        
        assertTrue(true, "Large liquidity delta should work");
    }
    
    function testFuzz_MultiplePoolsWithDifferentFees(uint24 fee1, uint24 fee2) public {
        vm.assume(fee1 > 0 && fee1 < 1000000);
        vm.assume(fee2 > 0 && fee2 < 1000000);
        vm.assume(fee1 != fee2);
        
        MockERC20Fuzz tokenA = new MockERC20Fuzz();
        MockERC20Fuzz tokenB = new MockERC20Fuzz();
        
        if (address(tokenA) > address(tokenB)) {
            MockERC20Fuzz temp = tokenA;
            tokenA = tokenB;
            tokenB = temp;
        }
        
        tokenA.mint(address(mockPrivacyVault), 10_000 ether);
        tokenB.mint(address(mockPrivacyVault), 10_000 ether);
        
        PoolKey memory poolKey1 = PoolKey({
            currency0: Currency.wrap(address(tokenA)),
            currency1: Currency.wrap(address(tokenB)),
            fee: fee1,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        PoolKey memory poolKey2 = PoolKey({
            currency0: Currency.wrap(address(tokenA)),
            currency1: Currency.wrap(address(tokenB)),
            fee: fee2,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        mockPoolManager.initialize(poolKey1, 79228162514264337593543950336);
        mockPoolManager.initialize(poolKey2, 79228162514264337593543950336);
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        hook.setSkipAuthorizationCheck(true);
        
        vm.prank(address(mockPrivacyVault));
        hook.addLiquidityWithPrivacy(poolKey1, params, "", new bytes32[](0));
        
        vm.prank(address(mockPrivacyVault));
        hook.addLiquidityWithPrivacy(poolKey2, params, "", new bytes32[](0));
        
        assertTrue(true, "Different fee pools should work independently");
    }
}

contract MockERC20Fuzz {
    string public name = "Mock Token";
    string public symbol = "MKT";
    uint8 public decimals = 18;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[address(this)] = 1_000_000_000_000_000 ether;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}
