import express from 'express';
import dashboardCtrl from '../controllers/dashboard.controller';


function routeProvider(passport) {
  const router = express.Router();
  const mw = passport.authenticate('jwt', {
    session: false
  });

  //TODO remove comment below - only for testing purpose
  router.use(mw);

  /** GET /api/dashboard/summary - Protected route */
  router.route('/summary')
    .get(dashboardCtrl.getSummary);


  router.route('/timeline')
    .get(dashboardCtrl.getTimeline);

  router.route('/network')
    .get(dashboardCtrl.getNetwork);

  router.route('/structure')
    .get(dashboardCtrl.getStructure);

  return router;
}

export default routeProvider;
