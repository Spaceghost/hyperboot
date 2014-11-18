var nameElem = document.querySelector('*[data-name]');
var appname = nameElem && nameElem.textContent;

var boothash = localStorage.getItem('hyperboot!' + appname + '!boot');
if (boothash) {
    var bootsrc = localStorage.getItem('hyperboot!' + appname + '!' + boothash);
    if (!bootsrc) {
        console.error('BOOTLOADER VERSION NOT FOUND: ' + boothash);
        console.error('USING BOOTLOADER BACKUP');
        backup();
    }
    try {
        eval(bootsrc)
    }
    catch (err) {
        console.error('ERROR LOADING BOOTLOADER:');
        console.error(err);
        console.error('USING BOOTLOADER BACKUP');
        backup();
    }
}
else backup();

function backup () {
    require('./main.js')();
}
