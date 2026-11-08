const { createRouter } = require('./router_engine');
const { requireAdmin } = require('./admin_auth');
const {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
} = require('../controllers/property_controller');

const router = createRouter();

// Public property browsing & filtering
router.get('/', listProperties);
router.get('/:id', getPropertyById);

// Admin CMS protected endpoints
router.post('/', requireAdmin, createProperty);
router.put('/:id', requireAdmin, updateProperty);
router.delete('/:id', requireAdmin, deleteProperty);

module.exports = router;

