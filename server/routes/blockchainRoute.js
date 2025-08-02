const express = require('express');
const { 
    createProposal, 
    castVote, 
    executeProposal, 
    cancelProposal, 
    getProposalDetails, 
    getVoteByUser, 
    setTargetWhitelist, 
    deleteExpiredProposal 
} = require('../controllers/blockchainController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/user_actions/auth');

const router = express.Router();

// Public routes
router.route('/proposal/:id').get(getProposalDetails);
router.route('/proposal/:id/vote/:voter').get(getVoteByUser);

// Routes (require authentication) 
router.route('/proposal/create').post(isAuthenticatedUser, createProposal);
router.route('/proposal/:id/vote').post(isAuthenticatedUser, castVote);
router.route('/proposal/:id/execute').post(isAuthenticatedUser, executeProposal);
router.route('/proposal/:id/cancel').post(isAuthenticatedUser, cancelProposal);
router.route('/proposal/:id/delete').delete(isAuthenticatedUser, deleteExpiredProposal);

// Admin only routes
router.route('/admin/target-whitelist').post(isAuthenticatedUser, authorizeRoles("admin"), setTargetWhitelist);

module.exports = router; 