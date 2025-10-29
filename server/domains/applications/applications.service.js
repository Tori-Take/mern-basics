const { Application } = require('./application.model');

const createApplication = async (applicationData) => {
  const application = await Application.create(applicationData);
  return application;
};

const getApplications = async () => {
  const applications = await Application.find();
  return applications;
};

module.exports = { createApplication, getApplications };
