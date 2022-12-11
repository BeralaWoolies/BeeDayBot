const format = require('date-fns/format')

const daysInAMonthLookUp = {
    January: 31,
    February: 29,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31,
}

exports.validDayAndMonth = function(date) {
    // Check if date is in the following format: dd/mm
    if (/[0-9]{2}\/[0-9]{2}/g.test(date)) {
        const digits = date.split('/').map(digit => parseInt(digit));
        // mm must be in the range 1-12
        if (digits[1] < 1 || digits[1] > 12) {
            return false;
        }
        // dd must be in the range 1-29/30/31
        const key = Object.keys(daysInAMonthLookUp)[digits[1] - 1];
        if (digits[0] < 1 || digits[0] > daysInAMonthLookUp[key]) {
            console.log(`${key} does not have ${digits[0]} days`);
            return false;
        }
        return true;
    }
    return false;
}

exports.formatDate = function(month, day) {
    return format(new Date(getCurrentYear(), month, day), "do 'of' LLLL");

}

function getCurrentYear() {
    return new Date().getFullYear();
}
