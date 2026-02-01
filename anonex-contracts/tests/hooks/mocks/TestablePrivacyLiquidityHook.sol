// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrivacyLiquidityHook} from "../../../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {BaseHook} from "v4-periphery/utils/BaseHook.sol";

/**
 * @title TestablePrivacyLiquidityHook
 * @notice Test version that skips hook address validation AND transient storage authorization
 */
contract TestablePrivacyLiquidityHook is PrivacyLiquidityHook {
    
    bool public skipAuthorizationCheck;
    
    constructor(
        IPoolManager _poolManager,
        address _privacyVault
    ) PrivacyLiquidityHook(_poolManager, _privacyVault) {}
    
    /**
     * @notice Override to skip address validation in tests
     */
    function validateHookAddress(BaseHook) internal pure override {}
    
    /**
     * @notice Enable/disable skipping authorization check (for testing)
     */
    function setSkipAuthorizationCheck(bool skip) external {
        skipAuthorizationCheck = skip;
    }
    
    /**
     * @notice Override to skip transient storage authorization check in tests
     */
    function _validateAuthorization() internal view override returns (bool isAuthorized) {
        if (skipAuthorizationCheck) {
            return true;
        }
        return super._validateAuthorization();
    }
}
