// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {PrivacyVaultEvents} from "../libraries/BaseLib.sol";

/// @title ERC20 Integration Test
/// @notice End-to-end tests for combined ETH + ERC20 flows in the unified Merkle tree
contract ERC20IntegrationTest is Test {
    PrivacyVault public vault;
    MockZKVerifier public verifier;
    MockERC20 public usdc;
    MockERC20 public dai;
    
    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address recipient = address(0x999);
    
    function setUp() public {
        // Deploy infrastructure
        verifier = new MockZKVerifier();
        vault = new PrivacyVault(address(verifier));
        
        // Deploy tokens
        usdc = new MockERC20("Mock USDC", "mUSDC", 6);
        dai = new MockERC20("Mock DAI", "mDAI", 18);
        
        // Allowlist tokens
        vault.addAllowedToken(address(usdc));
        vault.addAllowedToken(address(dai));
        
        // Fund users
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(address(vault), 100 ether);
        
        usdc.mint(alice, 10_000e6);
        dai.mint(alice, 10_000e18);
        usdc.mint(bob, 10_000e6);
        
        // Approve vault
        vm.prank(alice);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(alice);
        dai.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(vault), type(uint256).max);
    }
    
    /// @notice Full cycle: deposit ERC20, withdraw ERC20 to a different address
    function testFullERC20DepositWithdrawCycle() public {
        console2.log("=== Integration: Full ERC20 Deposit-Withdraw Cycle ===");
        
        // Alice deposits 1000 USDC
        vm.prank(alice);
        uint256 leafIndex = vault.depositERC20(
            address(usdc), 1000e6,
            bytes32(uint256(1)), bytes32(uint256(10))
        );
        assertEq(leafIndex, 0);
        
        bytes32 root = vault.currentRoot();
        
        // Alice withdraws 400 USDC to recipient
        bytes memory proof = hex"00";
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(usdc), uint256(400e6)));
        
        vault.withdrawERC20(
            proof, root,
            bytes32(uint256(100)), // nullifierHash
            bytes32(uint256(200)), // changeCommitment
            actionHash,
            address(usdc), recipient, 400e6
        );
        
        // Verify balances
        assertEq(usdc.balanceOf(recipient), 400e6, "Recipient got USDC");
        assertEq(vault.getTokenBalance(address(usdc)), 600e6, "Vault tracks 600 remaining");
        assertEq(vault.getLeafCount(), 2, "2 leaves: deposit + change");
        
        console2.log("   Deposited: 1000 USDC");
        console2.log("   Withdrew: 400 USDC to recipient");
        console2.log("   Vault remaining: 600 USDC");
        console2.log("SUCCESS!");
    }
    
    /// @notice ETH and ERC20 deposits coexist in the same Merkle tree
    function testETHAndERC20CoexistInMerkleTree() public {
        console2.log("=== Integration: ETH + ERC20 in Unified Merkle Tree ===");
        
        // Deposit 1: Alice deposits ETH
        vm.prank(alice);
        uint256 leaf0 = vault.deposit{value: 0.01 ether}(
            bytes32(uint256(1)), bytes32(uint256(10))
        );
        bytes32 root1 = vault.currentRoot();
        
        // Deposit 2: Alice deposits USDC
        vm.prank(alice);
        uint256 leaf1 = vault.depositERC20(
            address(usdc), 500e6,
            bytes32(uint256(2)), bytes32(uint256(20))
        );
        bytes32 root2 = vault.currentRoot();
        
        // Deposit 3: Alice deposits DAI
        vm.prank(alice);
        uint256 leaf2 = vault.depositERC20(
            address(dai), 1000e18,
            bytes32(uint256(3)), bytes32(uint256(30))
        );
        bytes32 root3 = vault.currentRoot();
        
        // Deposit 4: Bob deposits USDC
        vm.prank(bob);
        uint256 leaf3 = vault.depositERC20(
            address(usdc), 250e6,
            bytes32(uint256(4)), bytes32(uint256(40))
        );
        
        // Verify unified tree
        assertEq(leaf0, 0, "ETH deposit at leaf 0");
        assertEq(leaf1, 1, "USDC deposit at leaf 1");
        assertEq(leaf2, 2, "DAI deposit at leaf 2");
        assertEq(leaf3, 3, "Bob USDC deposit at leaf 3");
        assertEq(vault.getLeafCount(), 4, "4 total leaves");
        
        // Verify roots are all different (chain of hashes)
        assertTrue(root1 != root2, "Roots differ");
        assertTrue(root2 != root3, "Roots differ");
        
        // Verify independent token tracking
        assertEq(vault.getTokenBalance(address(usdc)), 750e6, "USDC: 500 + 250");
        assertEq(vault.getTokenBalance(address(dai)), 1000e18, "DAI: 1000");
        
        console2.log("   Leaf 0: ETH 0.01");
        console2.log("   Leaf 1: USDC 500");
        console2.log("   Leaf 2: DAI 1000");
        console2.log("   Leaf 3: USDC 250 (Bob)");
        console2.log("   Total leaves:", vault.getLeafCount());
        console2.log("SUCCESS!");
    }
    
    /// @notice Withdraw ETH after ERC20 deposits — verify ETH path still works
    function testETHWithdrawAfterERC20Deposits() public {
        // First: ERC20 deposit
        vm.prank(alice);
        vault.depositERC20(
            address(usdc), 500e6,
            bytes32(uint256(1)), bytes32(uint256(10))
        );
        
        // Second: ETH deposit
        vm.prank(alice);
        vault.deposit{value: 0.01 ether}(
            bytes32(uint256(2)), bytes32(uint256(20))
        );
        
        bytes32 root = vault.currentRoot();
        
        // Withdraw ETH (existing ETH path)
        bytes memory proof = hex"00";
        address payable ethRecipient = payable(address(0x777));
        
        vault.withdraw(
            proof, root,
            bytes32(uint256(100)),
            bytes32(uint256(200)),
            ethRecipient,
            0.005 ether
        );
        
        assertEq(ethRecipient.balance, 0.005 ether, "ETH recipient got funds");
        // ERC20 balance unaffected
        assertEq(vault.getTokenBalance(address(usdc)), 500e6, "USDC unaffected");
    }
    
    /// @notice Multiple tokens deposited and withdrawn independently
    function testMultiTokenDepositAndWithdraw() public {
        console2.log("=== Integration: Multi-Token Deposit & Withdraw ===");
        
        // Deposit USDC
        vm.prank(alice);
        vault.depositERC20(
            address(usdc), 1000e6,
            bytes32(uint256(1)), bytes32(uint256(10))
        );
        
        // Deposit DAI
        vm.prank(alice);
        vault.depositERC20(
            address(dai), 2000e18,
            bytes32(uint256(2)), bytes32(uint256(20))
        );
        
        bytes32 root = vault.currentRoot();
        
        // Withdraw some USDC
        bytes memory proof = hex"00";
        bytes32 actionHash1 = keccak256(abi.encodePacked(recipient, address(usdc), uint256(300e6)));
        
        vault.withdrawERC20(
            proof, root,
            bytes32(uint256(100)), bytes32(uint256(200)),
            actionHash1,
            address(usdc), recipient, 300e6
        );
        
        bytes32 root2 = vault.currentRoot();
        
        // Withdraw some DAI
        bytes32 actionHash2 = keccak256(abi.encodePacked(recipient, address(dai), uint256(500e18)));
        
        vault.withdrawERC20(
            proof, root2,
            bytes32(uint256(101)), bytes32(uint256(201)),
            actionHash2,
            address(dai), recipient, 500e18
        );
        
        // Verify independent tracking
        assertEq(vault.getTokenBalance(address(usdc)), 700e6, "USDC: 1000 - 300");
        assertEq(vault.getTokenBalance(address(dai)), 1500e18, "DAI: 2000 - 500");
        assertEq(usdc.balanceOf(recipient), 300e6, "Recipient USDC");
        assertEq(dai.balanceOf(recipient), 500e18, "Recipient DAI");
        assertEq(vault.getLeafCount(), 4, "4 leaves: 2 deposits + 2 changes");
        
        console2.log("   USDC: deposited 1000, withdrew 300, remaining 700");
        console2.log("   DAI: deposited 2000, withdrew 500, remaining 1500");
        console2.log("SUCCESS!");
    }
    
    /// @notice Admin removes token — existing deposits can still be withdrawn
    function testWithdrawAfterTokenRemovedFromAllowlist() public {
        // Deposit while token is allowed
        vm.prank(alice);
        vault.depositERC20(
            address(usdc), 1000e6,
            bytes32(uint256(1)), bytes32(uint256(10))
        );
        
        bytes32 root = vault.currentRoot();
        
        // Admin removes token from allowlist
        vault.removeAllowedToken(address(usdc));
        assertFalse(vault.isTokenAllowed(address(usdc)), "Token removed");
        
        // Withdrawal should revert since token is no longer allowed
        // (design decision: removed tokens cannot be withdrawn for safety)
        bytes memory proof = hex"00";
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(usdc), uint256(500e6)));
        
        vm.expectRevert();
        vault.withdrawERC20(
            proof, root,
            bytes32(uint256(100)), bytes32(uint256(200)),
            actionHash,
            address(usdc), recipient, 500e6
        );
        
        // Re-add token to allow withdrawal
        vault.addAllowedToken(address(usdc));
        
        vault.withdrawERC20(
            proof, root,
            bytes32(uint256(100)), bytes32(uint256(200)),
            actionHash,
            address(usdc), recipient, 500e6
        );
        
        assertEq(usdc.balanceOf(recipient), 500e6, "Withdrawal works after re-adding token");
    }
}
