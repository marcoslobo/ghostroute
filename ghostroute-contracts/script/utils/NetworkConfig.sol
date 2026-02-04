// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

/// @title NetworkConfig
/// @notice Utility contract for network-specific configuration
/// @dev Contains addresses and parameters for different networks
contract NetworkConfig is Script {
    
    /// @notice Network information structure
    struct Info {
        uint256 chainId;
        string name;
        string rpcUrl;
        address poolManager;
        address weth9;
        address multicall;
        string explorer;
    }
    
    /// @notice Get network info by chain ID
    function getNetworkInfo(uint256 chainId) public pure returns (Info memory) {
        if (chainId == 1) {
            return _ethereumMainnet();
        } else if (chainId == 11155111) {
            return _sepolia();
        } else if (chainId == 8453) {
            return _baseMainnet();
        } else if (chainId == 84532) {
            return _baseSepolia();
        } else if (chainId == 31337) {
            return _anvil();
        } else {
            revert("NetworkConfig: Unknown chain ID");
        }
    }
    
    /// @notice Check if network is a testnet
    function isTestnet(uint256 chainId) public pure returns (bool) {
        return chainId == 11155111 || // Sepolia
               chainId == 84532 ||     // Base Sepolia
               chainId == 31337;      // Anvil
    }
    
    /// @notice Print current network info
    function printNetworkInfo() public view {
        Info memory info = getNetworkInfo(block.chainid);
        console.log("Network:", info.name);
        console.log("Chain ID:", info.chainId);
        console.log("WETH9:", info.weth9);
        console.log("Explorer:", info.explorer);
    }
    
    /// @notice Ethereum Mainnet configuration
    function _ethereumMainnet() private pure returns (Info memory) {
        return Info({
            chainId: 1,
            name: "Ethereum Mainnet",
            rpcUrl: "https://eth.llamarpc.com",
            poolManager: address(0),
            weth9: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
            multicall: 0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696,
            explorer: "https://etherscan.io"
        });
    }
    
    /// @notice Sepolia Testnet configuration
    function _sepolia() private pure returns (Info memory) {
        return Info({
            chainId: 11155111,
            name: "Sepolia Testnet",
            rpcUrl: "https://rpc.sepolia.org",
            poolManager: 0x8CF32B63ca23B8a5a48dA3c319e38E59B4Ca5dA0,
            weth9: 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9,
            multicall: 0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696,
            explorer: "https://sepolia.etherscan.io"
        });
    }
    
    /// @notice Base Mainnet configuration
    function _baseMainnet() private pure returns (Info memory) {
        return Info({
            chainId: 8453,
            name: "Base Mainnet",
            rpcUrl: "https://mainnet.base.org",
            poolManager: address(0),
            weth9: 0x4200000000000000000000000000000000000006,
            multicall: 0xcA11bde05977b3631167028862bE2a173976CA11,
            explorer: "https://basescan.org"
        });
    }
    
    /// @notice Base Sepolia Testnet configuration
    function _baseSepolia() private pure returns (Info memory) {
        return Info({
            chainId: 84532,
            name: "Base Sepolia Testnet",
            rpcUrl: "https://sepolia.base.org",
            poolManager: address(0),
            weth9: 0x4200000000000000000000000000000000000006,
            multicall: 0xcA11bde05977b3631167028862bE2a173976CA11,
            explorer: "https://sepolia.basescan.org"
        });
    }
    
    /// @notice Anvil (Hardhat/Foundry) local network
    function _anvil() private pure returns (Info memory) {
        return Info({
            chainId: 31337,
            name: "Anvil Local",
            rpcUrl: "http://127.0.0.1:8545",
            poolManager: address(0),
            weth9: address(0),
            multicall: address(0),
            explorer: "http://localhost:8545"
        });
    }
}
