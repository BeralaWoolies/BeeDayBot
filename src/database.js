let database = [];

module.exports = {
    getData: () => {
        return database;
    },
    setData: (data) => {
        database = data;
    }
};
