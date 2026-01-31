// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Permit2 Integration Constants
/// @notice Constants and interfaces for Permit2 integration
library Permit2Constants {
    // Mainnet addresses
    address internal constant PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address internal constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    // Zero address for ETH
    address internal constant ETH_ADDRESS = address(0);
}

/// @title IPermit2 Interface
/// @notice Minimal Permit2 interface for PrivacyVault
interface IPermit2 {
    struct PermitDetails {
        address token;
        uint160 amount;
        uint48 expiration;
        uint48 nonce;
    }

    struct PermitSingle {
        PermitDetails details;
        address spender;
        uint256 sigDeadline;
    }

    function permit(
        address owner,
        PermitSingle memory permitSingle,
        bytes calldata signature
    ) external;
    
    function transferFrom(
        address from,
        address to,
        uint160 amount,
        address token
    ) external;
    
    function permitTransferFrom(
        PermitTransferFrom permit,
        SignatureTransferDetails transferDetails,
        address owner,
        bytes calldata signature
    ) external;
}

/// @title IWETH Interface
/// @notice Interface for WETH (Wrapped Ether)
interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/// @title Permit2 Types
/// @notice Additional types for Permit2 integration
type SignatureTransferDetails is bytes32;
type PermitTransferFrom is bytes32;