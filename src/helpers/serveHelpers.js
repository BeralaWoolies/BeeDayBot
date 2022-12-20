let serving = [];

exports.isCurrentlyServing = function(discordId) {
    return serving.includes(discordId);
};

exports.finishServing = function(discordId) {
    serving = serving.filter(userId => userId !== discordId);
};

exports.serve = function(discordId) {
    serving.unshift(discordId);
};
