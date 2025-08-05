const express = require('express');
const { 
    createProposal, 
    castVote, 
    executeProposal, 
    cancelProposal, 
    getProposalDetails, 
    getVoteByUser, 
    getProposalVotes,
    setTargetWhitelist, 
    deleteExpiredProposal 
} = require('../controllers/blockchainController');

const router = express.Router();

// All routes are public 
router.route('/proposal/details').post(getProposalDetails);
router.route('/proposal/votes').post(getProposalVotes);
router.route('/proposal/vote-by-user').post(getVoteByUser);
router.route('/proposal/create').post(createProposal);
router.route('/proposal/vote').post(castVote);
router.route('/proposal/execute').post(executeProposal);
router.route('/proposal/cancel').post(cancelProposal);
router.route('/proposal/delete').post(deleteExpiredProposal);
router.route('/admin/target-whitelist').post(setTargetWhitelist);

module.exports = router; 