const applicationService = require('./applications.service');

const createApplication = async (req, res, next) => {
  try {
    const application = await applicationService.createApplication(req.body);
    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getApplications();
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createApplication, getApplications };
