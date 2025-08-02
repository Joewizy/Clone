const { ethers } = require("ethers");


const CONTRACT_ABI = require("../lib/abis/governance.json"); 
const GOVERNANCE_CONTRACT_ADDRESS = "";
const PROVIDER_URL = ""; 
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Owner wallet key

// -------------------------------
// INITIALIZE PROVIDER & SIGNER
// -------------------------------
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// -------------------------------
// INITIALIZE CONTRACT INSTANCE
// -------------------------------
const governanceContract = new ethers.Contract(
  GOVERNANCE_CONTRACT_ADDRESS,
  CONTRACT_ABI,
  signer
);

// -------------------------------
// FUNCTIONS
// -------------------------------

/**
 * Create a proposal
 */
const createProposal = async (req, res) => {
  try {
    const { description, targetAddress, callData } = req.body;
    
    if (!description || !targetAddress || !callData) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: description, targetAddress, callData"
      });
    }

    const tx = await governanceContract.createProposal(description, targetAddress, callData);
    await tx.wait();
    
    res.status(201).json({
      success: true,
      message: "Proposal created successfully",
      transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create proposal",
      error: error.message
    });
  }
};

/**
 * Cast a vote
 */
const castVote = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { support } = req.body;
    
    if (support === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: support (boolean)"
      });
    }

    const tx = await governanceContract.castVote(proposalId, support);
    await tx.wait();
    
    res.status(200).json({
      success: true,
      message: "Vote cast successfully",
      transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cast vote",
      error: error.message
    });
  }
};

/**
 * Execute proposal
 */
const executeProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const tx = await governanceContract.executeProposal(proposalId);
    await tx.wait();
    
    res.status(200).json({
      success: true,
      message: "Proposal executed successfully",
      transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to execute proposal",
      error: error.message
    });
  }
};

/**
 * Cancel proposal
 */
const cancelProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const tx = await governanceContract.cancelProposal(proposalId);
    await tx.wait();
    
    res.status(200).json({
      success: true,
      message: "Proposal canceled successfully",
      transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel proposal",
      error: error.message
    });
  }
};

/**
 * Fetch proposal details
 */
const getProposalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const details = await governanceContract.getProposalDetails(id);
    
    res.status(200).json({
      success: true,
      data: {
        proposer: details[0],
        description: details[1],
        createdAt: Number(details[2]),
        votesFor: ethers.utils.formatEther(details[3]),
        votesAgainst: ethers.utils.formatEther(details[4]),
        executed: details[5],
        canceled: details[6],
        state: details[7],
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch proposal details",
      error: error.message
    });
  }
};

/**
 * Get a voter's choice
 */
const getVoteByUser = async (req, res) => {
  try {
    const { id, voter } = req.params;
    
    const vote = await governanceContract.getVoteByUser(id, voter);
    
    const voteStatus = {
      0: "None",
      1: "For", 
      2: "Against"
    };
    
    res.status(200).json({
      success: true,
      data: {
        proposalId: id,
        voter: voter,
        vote: vote,
        voteStatus: voteStatus[vote]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch vote",
      error: error.message
    });
  }
};

/**
 * Whitelist or blacklist a target
 */
const setTargetWhitelist = async (req, res) => {
  try {
    const { targetAddress, allowed } = req.body;
    
    if (!targetAddress || allowed === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: targetAddress, allowed"
      });
    }

    const tx = await governanceContract.setTargetWhitelist(targetAddress, allowed);
    await tx.wait();
    
    res.status(200).json({
      success: true,
      message: `Target ${allowed ? 'whitelisted' : 'blacklisted'} successfully`,
      transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update target whitelist",
      error: error.message
    });
  }
};

/**
 * Clean up expired proposal
 */
const deleteExpiredProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const tx = await governanceContract.deleteExpiredProposals(proposalId);
    await tx.wait();
    
    res.status(200).json({
      success: true,
      message: "Expired proposal deleted successfully",
      transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete expired proposal",
      error: error.message
    });
  }
};


module.exports = {
  createProposal,
  castVote,
  executeProposal,
  cancelProposal,
  getProposalDetails,
  getVoteByUser,
  setTargetWhitelist,
  deleteExpiredProposal,
};
