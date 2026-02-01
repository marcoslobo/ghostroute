// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TransientStorage} from "../../src/libraries/TransientStorage.sol";

/**
 * @title TransientStorageTest
 * @notice Tests for EIP-1153 transient storage operations
 */
contract TransientStorageTest is Test {
    
    // Test addresses
    address constant ALICE = address(0x1);
    address constant BOB = address(0x2);
    
    // Custom slot for testing
    bytes32 constant TEST_SLOT = keccak256("test.slot");
    
    function test_AuthorizationSlotIsConsistent() public pure {
        // Verify the slot is computed consistently
        bytes32 expectedSlot = keccak256("anonex.privacy.authorized");
        assertEq(TransientStorage.AUTHORIZATION_SLOT, expectedSlot);
    }
    
    function test_SetAndGetAuthorization() public {
        // Initially should be zero
        address initial = TransientStorage.getAuthorization();
        assertEq(initial, address(0), "Initial authorization should be zero");
        
        // Set authorization
        TransientStorage.setAuthorization(ALICE);
        
        // Should return ALICE
        address authorized = TransientStorage.getAuthorization();
        assertEq(authorized, ALICE, "Authorization should be ALICE");
    }
    
    function test_ClearAuthorization() public {
        // Set authorization
        TransientStorage.setAuthorization(ALICE);
        assertEq(TransientStorage.getAuthorization(), ALICE);
        
        // Clear authorization
        TransientStorage.clearAuthorization();
        
        // Should be zero again
        assertEq(TransientStorage.getAuthorization(), address(0), "Authorization should be cleared");
    }
    
    function test_IsAuthorized() public {
        // Initially no one is authorized
        assertFalse(TransientStorage.isAuthorized(ALICE));
        assertFalse(TransientStorage.isAuthorized(BOB));
        
        // Authorize ALICE
        TransientStorage.setAuthorization(ALICE);
        
        // Only ALICE should be authorized
        assertTrue(TransientStorage.isAuthorized(ALICE));
        assertFalse(TransientStorage.isAuthorized(BOB));
    }
    
    function test_OverwriteAuthorization() public {
        // Set ALICE
        TransientStorage.setAuthorization(ALICE);
        assertTrue(TransientStorage.isAuthorized(ALICE));
        
        // Overwrite with BOB
        TransientStorage.setAuthorization(BOB);
        
        // Now only BOB should be authorized
        assertFalse(TransientStorage.isAuthorized(ALICE));
        assertTrue(TransientStorage.isAuthorized(BOB));
    }
    
    function test_TstoreAndTloadAddress() public {
        // Test raw tstore/tload for address
        TransientStorage.tstoreAddress(TEST_SLOT, ALICE);
        address loaded = TransientStorage.tloadAddress(TEST_SLOT);
        assertEq(loaded, ALICE);
    }
    
    function test_TstoreAndTloadBytes32() public {
        // Test raw tstore/tload for bytes32
        bytes32 testValue = keccak256("test value");
        TransientStorage.tstoreBytes32(TEST_SLOT, testValue);
        bytes32 loaded = TransientStorage.tloadBytes32(TEST_SLOT);
        assertEq(loaded, testValue);
    }
    
    function test_DifferentSlotsAreIndependent() public {
        bytes32 slot1 = keccak256("slot1");
        bytes32 slot2 = keccak256("slot2");
        
        // Store different values in different slots
        TransientStorage.tstoreAddress(slot1, ALICE);
        TransientStorage.tstoreAddress(slot2, BOB);
        
        // Each slot should have its own value
        assertEq(TransientStorage.tloadAddress(slot1), ALICE);
        assertEq(TransientStorage.tloadAddress(slot2), BOB);
    }
    
    function testFuzz_SetAndGetAuthorization(address randomAddress) public {
        TransientStorage.setAuthorization(randomAddress);
        assertEq(TransientStorage.getAuthorization(), randomAddress);
    }
    
    function testFuzz_IsAuthorized(address authorized, address caller) public {
        TransientStorage.setAuthorization(authorized);
        
        if (authorized == caller) {
            assertTrue(TransientStorage.isAuthorized(caller));
        } else {
            assertFalse(TransientStorage.isAuthorized(caller));
        }
    }
}
