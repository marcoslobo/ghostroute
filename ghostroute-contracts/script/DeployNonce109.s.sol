// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

contract DeploySepoliaNonce is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console2.log("Deployer:", deployer);
        console2.log("Nonce atual:", vm.getNonce(deployer));
        console2.log("PoolManager:", POOL_MANAGER);

        vm.startBroadcast(pk);

        // Deploy hook at nonce 109
        console2.log("\nDeploying hook at nonce 109...");
        address hook = address(new PrivacyLiquidityHook(
            IPoolManager(POOL_MANAGER),
            address(0)
        ));
        console2.log("Hook:", hook);

        vm.stopBroadcast();
    }
}
