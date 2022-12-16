exports.disableAllButtons = function(row) {
    row.components.forEach(component => component.setDisabled(true));
};
