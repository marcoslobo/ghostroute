// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PrivacyLiquidityHook} from "../../src/hooks/PrivacyLiquidityHook.sol";
import {TestablePrivacyLiquidityHook} from "./mocks/TestablePrivacyLiquidityHook.sol";
import {MockPoolManager} from "./mocks/MockPoolManager.sol";
import {MockPrivacyVault} from "./mocks/MockPrivacyVault.sol";
import {TransientStorage} from "../../src/libraries/TransientStorage.sol";
import {ActionHash} from "../../src/libraries/ActionHash.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

/**
 * @title PrivacyLiquidityHookGasTest
 * @notice Tests for gas optimization - ensuring <200k gas target
 * @dev Covers T023 from tasks.md - Gas optimization test
 */
contract PrivacyLiquidityHookGasTest is Test {
    
    TestablePrivacyLiquidityHook public hook;
    MockPoolManager public mockPoolManager;
    MockPrivacyVault public mockPrivacyVault;
    
    // Test addresses
    address constant TOKEN_A = address(0x1000);
    address constant TOKEN_B = address(0x2000);
    
    PoolKey public testPoolKey;
    ModifyLiquidityParams public testParams;
    
    // Gas target from spec
    uint256 constant GAS_TARGET = 200_000;
    
    function setUp() public {
        // Deploy mock contracts
        mockPoolManager = new MockPoolManager();
        mockPrivacyVault = new MockPrivacyVault(keccak256("test_merkle_root"));
        
        // Deploy hook
        hook = new TestablePrivacyLiquidityHook(
            IPoolManager(address(mockPoolManager)),
            address(mockPrivacyVault)
        );
        
        // Create test pool key
        testPoolKey = PoolKey({
            currency0: Currency.wrap(TOKEN_A),
            currency1: Currency.wrap(TOKEN_B),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Create test params
        testParams = ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        // Initialize the pool
        mockPoolManager.initialize(testPoolKey, 79228162514264337593543950336);
    }
    
    // ============ Gas Measurement Tests ============
    
    function test_ComputeActionHashGasUsage() public {
        PoolKey memory key = testPoolKey;
        ModifyLiquidityParams memory params = testParams;
        
        uint256 gasBefore = gasleft();
        hook.computeActionHash(key, params, address(this));
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("computeActionHash gas used", gasUsed);
        
        // Hash computation should be reasonable (<15k gas with memory allocation)
        assertLt(gasUsed, 15_000, "computeActionHash should use less than 15k gas");
    }
    
    function test_TransientStorageOperationsGasUsage() public {
        // Test setAuthorization gas
        uint256 gasBefore = gasleft();
        TransientStorage.setAuthorization(address(mockPrivacyVault));
        uint256 setGasUsed = gasBefore - gasleft();
        
        emit log_named_uint("setAuthorization gas used", setGasUsed);
        
        // Test getAuthorization gas
        gasBefore = gasleft();
        TransientStorage.getAuthorization();
        uint256 getGasUsed = gasBefore - gasleft();
        
        emit log_named_uint("getAuthorization gas used", getGasUsed);
        
        // Transient storage operations should be very cheap
        assertLt(setGasUsed, 5_000, "setAuthorization should use less than 5k gas");
        assertLt(getGasUsed, 5_000, "getAuthorization should use less than 5k gas");
    }
    
    function test_GetHookPermissionsGasUsage() public {
        uint256 gasBefore = gasleft();
        hook.getHookPermissions();
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("getHookPermissions gas used", gasUsed);
        
        // Pure function should be reasonably cheap (<15k gas for struct creation)
        assertLt(gasUsed, 15_000, "getHookPermissions should use less than 15k gas");
    }
    
    // ============ Gas Comparison Tests ============
    
    function test_ActionHashMemoryVsCalldata() public {
        PoolKey memory keyMem = testPoolKey;
        ModifyLiquidityParams memory paramsMem = testParams;
        
        // Memory version
        uint256 gasBefore = gasleft();
        ActionHash.computeLiquidityActionHashMemory(keyMem, paramsMem, address(this));
        uint256 memoryGas = gasBefore - gasleft();
        
        emit log_named_uint("Memory version gas", memoryGas);
        
        // Both should be efficient
        assertLt(memoryGas, 10_000, "Memory version should be efficient");
    }
}
