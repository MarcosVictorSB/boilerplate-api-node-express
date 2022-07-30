const { conflict, OK, serverError } = require('../../../protocols/https');
const enumHelperCustomer = require('../../../helpers/enumHelperCustomer');
const CustomerService = require('../../customers/services/customer-service');
const logger = require('../../../config/logger');
const AdapterToken = require('../adapter/adapterToken');

class AuthenticationService {
  constructor(params = {}) {
    this.enumHelperCustomer = params.enumHelperCustomer || enumHelperCustomer;
    this.customerService = params.customerService || new CustomerService();
    this.logger = params.logger || logger;
    this.adapterToken = params.adapterToken || AdapterToken;
  }

  async authenticate(email, password) {
    try {
      const result = await this.customerService.getByEmail(email);

      const { result: user } = result.body;
      if (!user) {
        this.logger.info(`User not found with email ${email}`);
        return conflict(this.enumHelperCustomer.customer.notFoundUser);
      }

      const isCompare = await this.customerService
        .comparePasswords(password, user.passwordEncryption);
      if (!isCompare) {
        this.logger.info('the password is incorrect');
        return conflict(this.enumHelperCustomer.customer.emailOrPassword);
      }
      /* eslint-disable no-param-reassign */
      user.passwordEncryption = undefined;
      user.token = this.adapterToken.sign(user.id);
      return OK(user);
    } catch (error) {
      this.logger.error('[AuthenticationService] - error to compare the password');
      return serverError(error.message);
    }
  }
}

module.exports = AuthenticationService;
