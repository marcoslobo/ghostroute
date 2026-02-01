// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ActionHash} from "../../src/libraries/ActionHash.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

/**
 * @title ActionHashWrapper
 * @notice Wrapper contract to expose library functions for testing reverts
 */
contract ActionHashWrapper {
    function validatePoolParametersMemory(
        PoolKey memory key,
        ModifyLiquidityParams memory params
    ) external pure returns (bool) {
        return ActionHash.validatePoolParametersMemory(key, params);
    }
}

/**
 * @title ActionHashTest
 * @notice Tests for ActionHash library - computing action hashes for ZK-proof alignment
 * @dev Covers T070-T073 from tasks.md
 */
contract ActionHashTest is Test {
    
    ActionHashWrapper public wrapper;
    
    // Test addresses
    address constant TOKEN_A = address(0x1000);
    address constant TOKEN_B = address(0x2000);
    address constant ALICE = address(0x1);
    address constant BOB = address(0x2);
    address constant HOOK_ADDRESS = address(0x3000);
    
    PoolKey internal testPoolKey;
    ModifyLiquidityParams internal testParams;
    
    function setUp() public {
        // Deploy wrapper for testing reverts
        wrapper = new ActionHashWrapper();
        
        // Create a valid pool key
        testPoolKey = PoolKey({
            currency0: Currency.wrap(TOKEN_A),
            currency1: Currency.wrap(TOKEN_B),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK_ADDRESS)
        });
        
        // Create valid liquidity params
        testParams = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
    }
    
    // ============ T070: ActionHash Computation Correctness ============
    
    function test_ComputeActionHashReturnsNonZero() public view {
        bytes32 actionHash = ActionHash.computeLiquidityActionHashMemory(
            testPoolKey,
            testParams,
            ALICE
        );
        
        assertTrue(actionHash != bytes32(0), "Action hash should not be zero");
    }
    
    function test_ComputeActionHashIncludesAllParameters() public view {
        // The hash should be the keccak256 of all encoded parameters
        bytes32 expectedHash = keccak256(abi.encode(
            testPoolKey.currency0,
            testPoolKey.currency1,
            testPoolKey.fee,
            testPoolKey.tickSpacing,
            testParams.tickLower,
            testParams.tickUpper,
            testParams.liquidityDelta,
            testParams.salt,
            ALICE
        ));
        
        bytes32 actionHash = ActionHash.computeLiquidityActionHashMemory(
            testPoolKey,
            testParams,
            ALICE
        );
        
        assertEq(actionHash, expectedHash, "Action hash should match expected encoding");
    }
    
    // ============ T071: Parameter Encoding Test ============
    
    function test_DifferentCurrency0ProducesDifferentHash() public view {
        PoolKey memory modifiedKey = testPoolKey;
        modifiedKey.currency0 = Currency.wrap(address(0x9999));
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(modifiedKey, testParams, ALICE);
        
        assertTrue(hash1 != hash2, "Different currency0 should produce different hash");
    }
    
    function test_DifferentCurrency1ProducesDifferentHash() public view {
        PoolKey memory modifiedKey = testPoolKey;
        modifiedKey.currency1 = Currency.wrap(address(0x9999));
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(modifiedKey, testParams, ALICE);
        
        assertTrue(hash1 != hash2, "Different currency1 should produce different hash");
    }
    
    function test_DifferentFeeProducesDifferentHash() public view {
        PoolKey memory modifiedKey = testPoolKey;
        modifiedKey.fee = 500; // Different fee tier
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(modifiedKey, testParams, ALICE);
        
        assertTrue(hash1 != hash2, "Different fee should produce different hash");
    }
    
    function test_DifferentTickSpacingProducesDifferentHash() public view {
        PoolKey memory modifiedKey = testPoolKey;
        modifiedKey.tickSpacing = 10;
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(modifiedKey, testParams, ALICE);
        
        assertTrue(hash1 != hash2, "Different tickSpacing should produce different hash");
    }
    
    function test_DifferentTickLowerProducesDifferentHash() public view {
        ModifyLiquidityParams memory modifiedParams = testParams;
        modifiedParams.tickLower = -1200;
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, modifiedParams, ALICE);
        
        assertTrue(hash1 != hash2, "Different tickLower should produce different hash");
    }
    
    function test_DifferentTickUpperProducesDifferentHash() public view {
        ModifyLiquidityParams memory modifiedParams = testParams;
        modifiedParams.tickUpper = 1200;
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, modifiedParams, ALICE);
        
        assertTrue(hash1 != hash2, "Different tickUpper should produce different hash");
    }
    
    function test_DifferentLiquidityDeltaProducesDifferentHash() public view {
        ModifyLiquidityParams memory modifiedParams = testParams;
        modifiedParams.liquidityDelta = 2000e18;
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, modifiedParams, ALICE);
        
        assertTrue(hash1 != hash2, "Different liquidityDelta should produce different hash");
    }
    
    function test_DifferentSaltProducesDifferentHash() public view {
        ModifyLiquidityParams memory modifiedParams = testParams;
        modifiedParams.salt = bytes32(uint256(1));
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, modifiedParams, ALICE);
        
        assertTrue(hash1 != hash2, "Different salt should produce different hash");
    }
    
    function test_DifferentRecipientProducesDifferentHash() public view {
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, BOB);
        
        assertTrue(hash1 != hash2, "Different recipient should produce different hash");
    }
    
    // ============ T072: Deterministic Hash Test ============
    
    function test_SameInputsProduceSameHash() public view {
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        
        assertEq(hash1, hash2, "Same inputs should produce same hash");
    }
    
    function test_HashIsDeterministicAcrossMultipleCalls() public view {
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        bytes32 hash3 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, ALICE);
        
        assertEq(hash1, hash2);
        assertEq(hash2, hash3);
    }
    
    // ============ Pool ID Tests ============
    
    function test_GetPoolIdReturnsConsistentValue() public {
        PoolKey memory key = testPoolKey;
        bytes32 poolId1 = ActionHash.getPoolIdMemory(key);
        bytes32 poolId2 = ActionHash.getPoolIdMemory(key);
        
        assertEq(poolId1, poolId2, "Pool ID should be consistent");
    }
    
    function test_GetPoolIdIsDifferentForDifferentPools() public {
        PoolKey memory key1 = testPoolKey;
        PoolKey memory differentPool = PoolKey({
            currency0: Currency.wrap(address(0x5000)),
            currency1: Currency.wrap(address(0x6000)),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(address(0))
        });
        
        bytes32 poolId1 = ActionHash.getPoolIdMemory(key1);
        bytes32 poolId2 = ActionHash.getPoolIdMemory(differentPool);
        
        assertTrue(poolId1 != poolId2, "Different pools should have different IDs");
    }
    
    // ============ Validation Tests ============
    
    function test_ValidatePoolParametersSuccess() public view {
        PoolKey memory key = testPoolKey;
        ModifyLiquidityParams memory params = testParams;
        bool isValid = wrapper.validatePoolParametersMemory(key, params);
        assertTrue(isValid, "Valid parameters should pass validation");
    }
    
    function test_ValidatePoolParametersFailsWithInvalidCurrencyOrder() public {
        PoolKey memory invalidKey = PoolKey({
            currency0: Currency.wrap(TOKEN_B), // Wrong order - B > A
            currency1: Currency.wrap(TOKEN_A),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK_ADDRESS)
        });
        ModifyLiquidityParams memory params = testParams;
        
        vm.expectRevert("Invalid currency order");
        wrapper.validatePoolParametersMemory(invalidKey, params);
    }
    
    function test_ValidatePoolParametersFailsWithInvalidFee() public {
        PoolKey memory invalidKey = testPoolKey;
        invalidKey.fee = 2000000; // > 100%
        ModifyLiquidityParams memory params = testParams;
        
        vm.expectRevert("Invalid fee tier");
        wrapper.validatePoolParametersMemory(invalidKey, params);
    }
    
    function test_ValidatePoolParametersFailsWithZeroTickSpacing() public {
        PoolKey memory invalidKey = testPoolKey;
        invalidKey.tickSpacing = 0;
        ModifyLiquidityParams memory params = testParams;
        
        vm.expectRevert("Invalid tick spacing");
        wrapper.validatePoolParametersMemory(invalidKey, params);
    }
    
    function test_ValidatePoolParametersFailsWithInvalidTickRange() public {
        PoolKey memory key = testPoolKey;
        ModifyLiquidityParams memory invalidParams = testParams;
        invalidParams.tickLower = 600;
        invalidParams.tickUpper = -600; // Lower > Upper
        
        vm.expectRevert("Invalid tick range");
        wrapper.validatePoolParametersMemory(key, invalidParams);
    }
    
    function test_ValidatePoolParametersFailsWithTickNotMultipleOfSpacing() public {
        PoolKey memory key = testPoolKey;
        ModifyLiquidityParams memory invalidParams = testParams;
        invalidParams.tickLower = -601; // Not multiple of 60
        
        vm.expectRevert("tickLower not multiple of tickSpacing");
        wrapper.validatePoolParametersMemory(key, invalidParams);
    }
    
    function test_ValidatePoolParametersFailsWithNonPositiveLiquidityDelta() public {
        PoolKey memory key = testPoolKey;
        ModifyLiquidityParams memory invalidParams = testParams;
        invalidParams.liquidityDelta = 0;
        
        vm.expectRevert("Invalid liquidity delta");
        wrapper.validatePoolParametersMemory(key, invalidParams);
    }
    
    function test_ValidatePoolParametersFailsWithNegativeLiquidityDelta() public {
        PoolKey memory key = testPoolKey;
        ModifyLiquidityParams memory invalidParams = testParams;
        invalidParams.liquidityDelta = -1000e18;
        
        vm.expectRevert("Invalid liquidity delta");
        wrapper.validatePoolParametersMemory(key, invalidParams);
    }
    
    // ============ Fuzz Tests ============
    
    function testFuzz_ActionHashIsDeterministic(
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta,
        bytes32 salt,
        address recipient
    ) public view {
        vm.assume(tickLower < tickUpper);
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: liquidityDelta,
            salt: salt
        });
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, params, recipient);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, params, recipient);
        
        assertEq(hash1, hash2, "Hash should be deterministic");
    }
    
    function testFuzz_DifferentRecipientsProduceDifferentHashes(
        address recipient1,
        address recipient2
    ) public view {
        vm.assume(recipient1 != recipient2);
        
        bytes32 hash1 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, recipient1);
        bytes32 hash2 = ActionHash.computeLiquidityActionHashMemory(testPoolKey, testParams, recipient2);
        
        assertTrue(hash1 != hash2, "Different recipients should produce different hashes");
    }
}
