// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Bridge
 * @dev Educational cross-chain bridge smart contract for Ethereum side (Lock & Unlock mechanism).
 */
contract Bridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Deposit {
        uint256 depositId;
        address user;
        address token;
        uint256 amount;
        string solanaRecipient;
        uint256 timestamp;
        bool processed;
    }

    address public relayer;
    address public supportedToken;
    uint256 public depositCount;

    mapping(uint256 => Deposit) public deposits;
    mapping(bytes32 => bool) public processedWithdrawals;

    // Events
    event DepositCreated(
        uint256 indexed depositId,
        address indexed user,
        address indexed token,
        uint256 amount,
        string solanaRecipient,
        uint256 timestamp
    );

    event WithdrawalCompleted(
        bytes32 indexed solanaTxHash,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Bridge: caller is not the relayer");
        _;
    }

    constructor(address _relayer, address _supportedToken) Ownable(msg.sender) {
        require(_relayer != address(0), "Bridge: invalid relayer address");
        require(_supportedToken != address(0), "Bridge: invalid token address");
        relayer = _relayer;
        supportedToken = _supportedToken;
    }

    /**
     * @dev Lock ERC-20 tokens on Ethereum to bridge to Solana.
     * @param token Address of ERC-20 token.
     * @param amount Quantity of tokens to lock.
     * @param solanaRecipient Base58 address of Solana recipient wallet.
     */
    function deposit(
        address token,
        uint256 amount,
        string memory solanaRecipient
    ) external nonReentrant returns (uint256) {
        require(token == supportedToken, "Bridge: unsupported token");
        require(amount > 0, "Bridge: amount must be greater than zero");
        require(bytes(solanaRecipient).length > 0, "Bridge: empty solana recipient");

        depositCount++;
        uint256 currentDepositId = depositCount;

        deposits[currentDepositId] = Deposit({
            depositId: currentDepositId,
            user: msg.sender,
            token: token,
            amount: amount,
            solanaRecipient: solanaRecipient,
            timestamp: block.timestamp,
            processed: false
        });

        // Lock tokens into Bridge contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit DepositCreated(
            currentDepositId,
            msg.sender,
            token,
            amount,
            solanaRecipient,
            block.timestamp
        );

        return currentDepositId;
    }

    /**
     * @dev Unlock ERC-20 tokens on Ethereum when SPL tokens are burned on Solana.
     * @param solanaTxHash Unique Solana burn transaction hash (or unique byte payload) for replay protection.
     * @param recipient Ethereum address receiving unlocked ERC-20 tokens.
     * @param amount Quantity of tokens to unlock.
     */
    function withdraw(
        bytes32 solanaTxHash,
        address recipient,
        uint256 amount
    ) external onlyRelayer nonReentrant {
        require(!processedWithdrawals[solanaTxHash], "Bridge: withdrawal already processed");
        require(recipient != address(0), "Bridge: invalid recipient address");
        require(amount > 0, "Bridge: amount must be greater than zero");

        uint256 contractBalance = IERC20(supportedToken).balanceOf(address(this));
        require(contractBalance >= amount, "Bridge: insufficient locked liquidity");

        processedWithdrawals[solanaTxHash] = true;

        IERC20(supportedToken).safeTransfer(recipient, amount);

        emit WithdrawalCompleted(
            solanaTxHash,
            recipient,
            supportedToken,
            amount,
            block.timestamp
        );
    }

    /**
     * @dev Mark deposit as processed on destination chain (relayer callback).
     */
    function markProcessed(uint256 depositId) external onlyRelayer {
        require(deposits[depositId].depositId != 0, "Bridge: deposit does not exist");
        require(!deposits[depositId].processed, "Bridge: deposit already marked processed");
        deposits[depositId].processed = true;
    }

    /**
     * @dev Get total locked balance of token in Bridge contract.
     */
    function lockedBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev View deposit details by ID.
     */
    function getDeposit(uint256 depositId) external view returns (Deposit memory) {
        return deposits[depositId];
    }

    /**
     * @dev Update relayer address.
     */
    function setRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "Bridge: invalid relayer address");
        address oldRelayer = relayer;
        relayer = newRelayer;
        emit RelayerUpdated(oldRelayer, newRelayer);
    }
}
