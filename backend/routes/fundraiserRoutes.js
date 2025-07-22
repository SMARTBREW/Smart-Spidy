const express = require('express');
const fundraiserController = require('../controllers/fundraiserController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const fundraiserValidation = require('../validators/fundraiser.validation');

const router = express.Router();

router.use(auth());

router.get('/stats', authorize('admin'), fundraiserController.getFundraiserStats);
router.get('/', validate(fundraiserValidation.getFundraisers), fundraiserController.getFundraisers);
router.post('/', validate(fundraiserValidation.createFundraiser), fundraiserController.createFundraiser);

router.get('/:id', validate(fundraiserValidation.getFundraiser), fundraiserController.getFundraiser);
router.patch('/:id', validate(fundraiserValidation.updateFundraiser), fundraiserController.updateFundraiser);
router.delete('/:id', authorize('admin'), validate(fundraiserValidation.deleteFundraiser), fundraiserController.deleteFundraiser);

module.exports = router; 