const express = require('express')
const router = express.Router();


const { 
    getEvents, 
    newEvent, 
    getSingleEvent, 
    updateEvent, 
    deleteProduct 
} = require('../controllers/eventController')

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')


router.route('/events').get(getEvents);
router.route('/event/:id').get(getSingleEvent);

router.route('/admin/event/new').post(isAuthenticatedUser, authorizeRoles('admin'), newEvent);

router.route('/admin/event/:id')
                .put(isAuthenticatedUser, authorizeRoles('admin'), updateEvent) 
                .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);

module.exports = router;