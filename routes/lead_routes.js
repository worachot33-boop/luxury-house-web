const { createRouter } = require('./router_engine');
const { requireAdmin } = require('./admin_auth');
const {
  createLead,
  listLeads,
  updateLeadStatus
} = require('../controllers/lead_controller');

const router = createRouter();

// Public VIP Private Viewing booking submission
router.post('/', createLead);

// Admin CMS protected lead management
router.get('/', requireAdmin, listLeads);
router.put('/:id/status', requireAdmin, updateLeadStatus);

module.exports = router;

