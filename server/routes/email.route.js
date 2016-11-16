import express from 'express';
import config from '../../config/env';
import emailCtrl from '../controllers/email.controller';

function routeProvider(passport) {
  const router = express.Router();
  const mw = passport.authenticate('jwt', {
    session: false
  });
  router.use(mw);
  /** GET /api/email - Protected route,
   * needs token returned by the above as header. Authorization: Bearer {token} */
  router.route('/')
    .get(emailCtrl.fetchAllMails);

  router.route('/sendBox')
    .get(emailCtrl.fetchSendMails);

  router.route('/draftBox')
    .get(emailCtrl.fetchDraftMails);

  router.route('/trashBox')
    .get(emailCtrl.fetchDeletedMails);

  router.route('/inBox')
    .get(emailCtrl.fetchInboxMails);

  router.route('/boxes')
    .get(emailCtrl.getBoxes);

  router.route('/addBox')
    .post(emailCtrl.addBox);

  router.route('/delBox')
    .post(emailCtrl.delBox);

  router.route('/renameBox')
    .post(emailCtrl.renameBox);

  router.route('/append')
    .post(emailCtrl.append);

  router.route('/move')
    .post(emailCtrl.move);

  router.route('/copy')
    .post(emailCtrl.copy);

  router.route('/send')
    .post(emailCtrl.sendEmail);

  return router;
}

export default routeProvider;
