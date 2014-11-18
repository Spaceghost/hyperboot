var bootsrc = localStorage.getItem('hyperboot!boot');
if (bootsrc) {
    try {
        eval(bootsrc)
    }
    catch (err) {
        console.error('ERROR LOADING BOOTLOADER:');
        console.error(err);
        console.error('USING LAST WORKING BACKUP');
        backup();
    }
}
else backup();

function backup () {
    require('./main.js')();
}
