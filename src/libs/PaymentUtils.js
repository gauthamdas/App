import _ from 'underscore';
import lodashGet from 'lodash/get';
import BankAccount from './models/BankAccount';
import * as Expensicons from '../components/Icon/Expensicons';
import getBankIcon from '../components/Icon/BankIcons';
import CONST from '../CONST';
import * as Localize from './Localize';

/**
 * Check to see if user has either a debit card or personal bank account added
 *
 * @param {Array} [cardList]
 * @param {Array} [bankAccountList]
 * @returns {Boolean}
 */
function hasExpensifyPaymentMethod(cardList = [], bankAccountList = []) {
    const validBankAccount = _.some(bankAccountList, (bankAccountJSON) => {
        const bankAccount = new BankAccount(bankAccountJSON);
        return bankAccount.isDefaultCredit();
    });

    // Hide any billing cards that are not P2P debit cards for now because you cannot make them your default method, or delete them
    const validDebitCard = _.some(cardList, card => lodashGet(card, 'accountData.additionalData.isP2PDebitCard', false));

    return validBankAccount || validDebitCard;
}

/**
 * Get the PaymentMethods list
 * @param {Array} bankAccountList
 * @param {Array} cardList
 * @param {Object} [payPalMeData = null]
 * @param {Object} personalBankAccount
 * @returns {Array<PaymentMethod>}
 */
function formatPaymentMethods(bankAccountList, cardList, payPalMeData = null, personalBankAccount = {}) {
    const combinedPaymentMethods = [];

    const pendingBankAccount = lodashGet(personalBankAccount, 'selectedBankAccount', {});

    // See if we need to show a pending bank account in the payment methods list
    if (!_.isEmpty(pendingBankAccount)) {
        // Get error from errorFields and pass it into the pendingBankAccount Object
        const pendingAccountErrors = lodashGet(personalBankAccount, 'errors', {});
        const sortedErrors = _.chain(pendingAccountErrors)
            .keys()
            .sortBy()
            .map(key => pendingAccountErrors[key])
            .value();
        pendingBankAccount.errors = sortedErrors;
        const {icon, iconSize} = getBankIcon(lodashGet(pendingBankAccount, 'additionalData.bankName', ''));
        combinedPaymentMethods.push({
            accountData: _.extend({}, pendingBankAccount, {icon}),
            accountType: CONST.PAYMENT_METHODS.BANK_ACCOUNT,
            description: `${Localize.translateLocal('paymentMethodList.accountLastFour')} ${pendingBankAccount.accountNumber.slice(-4)}`,
            errors: pendingBankAccount.errors,
            icon,
            iconSize,
            isDefault: false,
            isPending: true,
            key: 'bankAccount-0',
            methodID: 0,
            pendingAction: pendingBankAccount.pendingAction,
            title: pendingBankAccount.addressName,
        });
    }

    _.each(bankAccountList, (bankAccount) => {
        // Add all bank accounts besides the wallet
        if (bankAccount.type === CONST.BANK_ACCOUNT_TYPES.WALLET) {
            return;
        }

        const {icon, iconSize} = getBankIcon(lodashGet(bankAccount, 'accountData.additionalData.bankName', ''));
        combinedPaymentMethods.push({
            ...bankAccount,
            icon,
            iconSize,
            errors: bankAccount.errors,
            pendingAction: bankAccount.pendingAction,
        });
    });

    _.each(cardList, (card) => {
        const {icon, iconSize} = getBankIcon(lodashGet(card, 'accountData.bank', ''), true);
        combinedPaymentMethods.push({
            ...card,
            icon,
            iconSize,
            errors: card.errors,
            pendingAction: card.pendingAction,
        });
    });

    if (!_.isEmpty(payPalMeData)) {
        combinedPaymentMethods.push({
            ...payPalMeData,
            icon: Expensicons.PayPal,
        });
    }

    return combinedPaymentMethods;
}

/**
 * @param {Number} currentBalance, in cents
 * @param {String} methodType
 * @returns {Number} the fee, in cents
 */
function calculateWalletTransferBalanceFee(currentBalance, methodType) {
    const transferMethodTypeFeeStructure = methodType === CONST.WALLET.TRANSFER_METHOD_TYPE.INSTANT
        ? CONST.WALLET.TRANSFER_METHOD_TYPE_FEE.INSTANT
        : CONST.WALLET.TRANSFER_METHOD_TYPE_FEE.ACH;
    const calculateFee = Math.ceil(currentBalance * (transferMethodTypeFeeStructure.RATE / 100));
    return Math.max(calculateFee, transferMethodTypeFeeStructure.MINIMUM_FEE);
}

export {
    calculateWalletTransferBalanceFee,
    formatPaymentMethods,
    hasExpensifyPaymentMethod,
};
