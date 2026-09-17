const IST_OFFSET_MINUTES = 330;


/**
 * Get current date/time in IST
 */
const getISTDate = () => {
    const now = new Date();

    return new Date(
        now.getTime() + IST_OFFSET_MINUTES * 60 * 1000
    );
};


/**
 * Get start and end of today in IST.
 *
 * Returns actual UTC Date objects that can safely
 * be used in MongoDB queries.
 */
const getTodayRangeIST = () => {
    const istNow = getISTDate();

    const year = istNow.getUTCFullYear();
    const month = istNow.getUTCMonth();
    const date = istNow.getUTCDate();

    const startOfDay = new Date(
        Date.UTC(
            year,
            month,
            date
        ) - IST_OFFSET_MINUTES * 60 * 1000
    );

    const endOfDay = new Date(
        Date.UTC(
            year,
            month,
            date + 1
        ) - IST_OFFSET_MINUTES * 60 * 1000
    );

    return {
        startOfDay,
        endOfDay
    };
};


/**
 * Get month range in IST.
 *
 * month = 1 to 12
 */
const getMonthRangeIST = (year, month) => {

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
    ) {
        throw new Error(
            "Invalid year or month"
        );
    }


    const startOfMonth = new Date(
        Date.UTC(
            year,
            month - 1,
            1
        ) - IST_OFFSET_MINUTES * 60 * 1000
    );


    const endOfMonth = new Date(
        Date.UTC(
            year,
            month,
            1
        ) - IST_OFFSET_MINUTES * 60 * 1000
    );


    return {
        startOfMonth,
        endOfMonth
    };
};


/**
 * Get complete year range in IST.
 */
const getYearRangeIST = (year) => {

    if (!Number.isInteger(year)) {
        throw new Error(
            "Invalid year"
        );
    }


    const startOfYear = new Date(
        Date.UTC(
            year,
            0,
            1
        ) - IST_OFFSET_MINUTES * 60 * 1000
    );


    const endOfYear = new Date(
        Date.UTC(
            year + 1,
            0,
            1
        ) - IST_OFFSET_MINUTES * 60 * 1000
    );


    return {
        startOfYear,
        endOfYear
    };
};


module.exports = {
    getISTDate,
    getTodayRangeIST,
    getMonthRangeIST,
    getYearRangeIST
};