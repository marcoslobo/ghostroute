// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TransientStorage
 * @notice Library for EIP-1153 transient storage operations
 * @dev Transient storage persists only within a single transaction
 *      and is automatically cleared at the end of the transaction.
 *      This is perfect for passing authorization state between contracts
 *      without persistent storage costs or state leakage.
 */
library TransientStorage {
    
    /**
     * @notice Slot for authorization status (address of authorized caller)
     * @dev Computed as keccak256("anonex.privacy.authorized")
     */
    bytes32 internal constant AUTHORIZATION_SLOT = keccak256("anonex.privacy.authorized");
    
    /**
     * @notice Writes an address value to transient storage
     * @param slot The storage slot to write to
     * @param value The address value to store
     * @dev Uses tstore opcode (EIP-1153)
     */
    function tstoreAddress(bytes32 slot, address value) internal {
        assembly {
            tstore(slot, value)
        }
    }
    
    /**
     * @notice Reads an address value from transient storage
     * @param slot The storage slot to read from
     * @return value The address value stored (or zero if not set)
     * @dev Uses tload opcode (EIP-1153)
     */
    function tloadAddress(bytes32 slot) internal view returns (address value) {
        assembly {
            value := tload(slot)
        }
    }
    
    /**
     * @notice Writes a bytes32 value to transient storage
     * @param slot The storage slot to write to
     * @param value The bytes32 value to store
     * @dev Uses tstore opcode (EIP-1153)
     */
    function tstoreBytes32(bytes32 slot, bytes32 value) internal {
        assembly {
            tstore(slot, value)
        }
    }
    
    /**
     * @notice Reads a bytes32 value from transient storage
     * @param slot The storage slot to read from
     * @return value The bytes32 value stored (or zero if not set)
     * @dev Uses tload opcode (EIP-1153)
     */
    function tloadBytes32(bytes32 slot) internal view returns (bytes32 value) {
        assembly {
            value := tload(slot)
        }
    }
    
    /**
     * @notice Sets the authorization address in transient storage
     * @param authorizedAddress The address authorized to perform the operation
     * @dev This should be called by PrivacyVault before calling the hook
     */
    function setAuthorization(address authorizedAddress) internal {
        tstoreAddress(AUTHORIZATION_SLOT, authorizedAddress);
    }
    
    /**
     * @notice Gets the authorization address from transient storage
     * @return authorizedAddress The address that was authorized (or zero if none)
     * @dev This should be called by the hook to verify authorization
     */
    function getAuthorization() internal view returns (address authorizedAddress) {
        return tloadAddress(AUTHORIZATION_SLOT);
    }
    
    /**
     * @notice Clears the authorization from transient storage
     * @dev Optional - authorization is automatically cleared at transaction end
     *      but explicit clearing can be used for clarity or security
     */
    function clearAuthorization() internal {
        tstoreAddress(AUTHORIZATION_SLOT, address(0));
    }
    
    /**
     * @notice Checks if an address is currently authorized
     * @param caller The address to check
     * @return isAuthorized True if the caller matches the authorized address
     */
    function isAuthorized(address caller) internal view returns (bool) {
        return getAuthorization() == caller;
    }
}
