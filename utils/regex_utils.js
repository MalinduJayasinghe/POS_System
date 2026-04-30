
const phone_regex = new RegExp('^07[0-9]{8}$');

const check_phone = (phone) => {
    return phone_regex.test(phone);
};