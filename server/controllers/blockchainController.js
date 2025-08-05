const { ethers } = require("ethers");

const CONTRACT_ABI = require("../../contracts/out/Governance.sol/Governance.json").abi; 
const GOVERNANCE_CONTRACT_ADDRESS = "0xB93479dD55f5D4B358CA7BFB5Bf6B4dCBfB5a249";
const PROVIDER_URL = process.env.RPC_URL; 
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Deployers

// -------------------------------
// INITIALIZE PROVIDER & SIGNER
// -------------------------------

if (!PROVIDER_URL || !PRIVATE_KEY) {
  throw new Error("ENV not configured properly")
}
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
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
    const receipt = await tx.wait();

    // Listen to event emitted on the blockchain so we can get the proposalID
    let proposalId = null;
    
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = governanceContract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === "ProposalCreated") {
            proposalId = parsedLog.args.proposalId;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: "Proposal created successfully",
      transactionHash: tx.hash,
      proposalId: proposalId ? proposalId.toString() : "Could not determine proposal ID from transaction"
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
    const { proposalId, support } = req.body;
    
    if (proposalId === undefined || proposalId === null || support === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: proposalId, support (boolean)"
      });
    }

    const proposalIdNum = BigInt(proposalId);
    const supportBool = Boolean(support);
    
    const tx = await governanceContract.castVote(proposalIdNum, supportBool);
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
    const { proposalId } = req.body;
    
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: proposalId"
      });
    }

    const tx = await governanceContract.executeProposal(BigInt(proposalId));
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
    const { proposalId } = req.body;
    
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: proposalId"
      });
    }

    const tx = await governanceContract.cancelProposal(BigInt(proposalId));
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
    const { proposalId } = req.body;
    
    if (proposalId === undefined || proposalId === null) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: proposalId"
      });
    }
    
    const details = await governanceContract.getProposalDetails(BigInt(proposalId));
    
    // Helper function to safely convert values to JSON-serializable format
    const safeValue = (value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    };
    
    const votesForFormatted = ethers.formatEther(details[3]);
    const votesAgainstFormatted = ethers.formatEther(details[4]);
    
    res.status(200).json({
      success: true,
      data: {
        proposalId: BigInt(proposalId).toString(),
        proposer: safeValue(details[0]),
        description: safeValue(details[1]),
        createdAt: safeValue(details[2]),
        votesFor: votesForFormatted,
        votesAgainst: votesAgainstFormatted,
        executed: safeValue(details[5]),
        canceled: safeValue(details[6]),
        state: safeValue(details[7]),
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
    const { proposalId, voter } = req.body;
    
    if (!proposalId || !voter) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: proposalId, voter"
      });
    }
    
    const vote = await governanceContract.getVoteByUser(BigInt(proposalId), voter);
    
    const voteStatus = {
      0: "None",
      1: "For", 
      2: "Against"
    };
    
    res.status(200).json({
      success: true,
      data: {
        proposalId: BigInt(proposalId).toString(),
        voter: voter,
        vote: vote.toString(),
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
 * Get proposal votes
 */
const getProposalVotes = async (req, res) => {
  try {
    const { proposalId } = req.body;
    
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: proposalId"
      });
    }
    
    const [votesFor, votesAgainst] = await governanceContract.getProposalVotes(BigInt(proposalId));
    
    res.status(200).json({
      success: true,
      data: {
        proposalId: BigInt(proposalId).toString(),
        votesFor: ethers.formatEther(votesFor),
        votesAgainst: ethers.formatEther(votesAgainst)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch proposal votes",
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
    const { proposalId } = req.body;
    
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: proposalId"
      });
    }

    const tx = await governanceContract.deleteExpiredProposals(BigInt(proposalId));
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
  getProposalVotes,
  setTargetWhitelist,
  deleteExpiredProposal,
};
