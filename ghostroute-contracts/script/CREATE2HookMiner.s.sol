// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title CREATE2HookMiner
 * @notice Mines for a valid salt that produces a hook address with correct permissions
 */
contract CREATE2HookMiner is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    uint160 constant BEFORE_ADD_LIQUIDITY_FLAG = 1 << 11;

    function run() external {
        console2.log("========================================");
        console2.log("  CREATE2 Hook Miner");
        console2.log("========================================");
        console2.log("");
        console2.log("PoolManager:", POOL_MANAGER);
        console2.log("Required: BEFORE_ADD_LIQUIDITY (1 << 5)");
        console2.log("");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("Deployer:", deployer);
        console2.log("");

        // Prepare bytecode
        bytes memory hookBytecode = type(PrivacyLiquidityHook).creationCode;
        bytes memory hookConstructor = abi.encode(IPoolManager(POOL_MANAGER), address(0));
        bytes memory fullBytecode = abi.encodePacked(hookBytecode, hookConstructor);
        bytes32 bytecodeHash = keccak256(fullBytecode);

        console2.log("Mining for valid salt...");
        console2.log("");

        uint256 attempts = 0;
        uint256 startNonce = vm.getNonce(deployer);

        // Mine for valid salt
        for (uint256 salt = 0; salt < 10000000; salt++) {
            bytes32 saltBytes = bytes32(salt);
            address computed = computeAddress(deployer, saltBytes, bytecodeHash);

            if ((uint160(computed) & BEFORE_ADD_LIQUIDITY_FLAG) != 0) {
                console2.log("Found valid salt!");
                console2.log("  Salt:", salt);
                console2.log("  Hook address:", computed);
                console2.log("  Attempts:", attempts);
                console2.log("");
                console2.log("========================================");
                console2.log("  Valid CREATE2 Salt Found!");
                console2.log("========================================");
                console2.log("");
                console2.log("Update your DeployWithCREATE2 script with:");
                console2.log("  bytes32 salt = bytes32(uint256(", salt, "));");
                console2.log("");
                console2.log("Or update DeployAll.s.sol to use CREATE2 with this salt.");
                console2.log("========================================");
                return;
            }

            attempts++;
            if (attempts % 100000 == 0) {
                console2.log("Attempts:", attempts);
            }
        }

        console2.log("No valid salt found after 10M attempts");
        revert("No valid salt found");
    }

    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes32 bytecodeHash
    ) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), deployer, salt, bytecodeHash)))));
    }
}
