var nameElem = document.querySelector('*[data-name]');
var appname = nameElem && nameElem.textContent;

var boothash;
if (/^#b=/.test(location.hash)) {
    boothash = location.hash.replace(/^#b=/, '');
}
else {
    boothash = localStorage.getItem('hyperboot!' + appname + '!boot');
}
if (boothash) {
    var bootsrc = localStorage.getItem('hyperboot!' + appname + '!' + boothash);
    if (!bootsrc) {
        console.error('BOOTLOADER VERSION NOT FOUND: ' + boothash);
        console.error('USING BOOTLOADER BACKUP');
        backup();
    }
    try {
        document.body.innerHTML = '';
        document.write(bootsrc);
    }
    catch (err) {
        console.error('ERROR LOADING BOOTLOADER:');
        console.error(err);
        console.error('USING BOOTLOADER BACKUP');
        return backup();
    }
    var ename = document.querySelector('*[data-name]');
    if (ename && appname) ename.textContent = appname;
}
else backup();

function backup () {
    require('./main.js');
}
