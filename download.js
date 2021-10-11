const request = require('request');
const fs = require('fs');
const cleaner = require('./regexp.js')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const mp3Duration = require('mp3-duration');
var Folder = '';
var i = 1;

// Make the folder create array of songs to download
function prepareDownload(scURL) {
    var URL = scURL;
    Folder = cleaner.cleanString(URL.substr(URL.indexOf("/sets/") + 6));
    fs.exists(__dirname + '\\Music\\' + Folder, function (exists) {
        if (!exists) {
            console.log('Creating Folder: "' + Folder + '"')
            fs.mkdir(__dirname + '\\Music\\' + Folder, function (err) {
                if (err == null) {
                    console.log("Foler created.");
                }
                else {
                    console.log(err);
                }
            });
        }
    });
    return new Promise(resolve => {

        request.post('https://www.singlemango.com/download/', {
            form: {
                url: URL
            }
        }, (err, res, body) => {
            var dom = new JSDOM(body);
            var $ = require('jquery')(dom.window);
            if ($('button[type="submit"]').length == $('input[type="hidden"]').length) {
                var songs = $('button[type="submit"]').length;
                var arrSongs = new Array();
                for (i = 0; i < songs; i++) {
                    arrSongs.push([$('input[type="hidden"]')[i].value, $('button[type="submit"]')[i].value]);
                }
                resolve(arrSongs);
            }
        });
    })
}
//Actually download the songs... And wait a bit.
function download(songName, songID) {
    return new Promise(resolve => {
        var path = __dirname + '\\Music\\' + Folder + '\\';
        setTimeout(() => {
            request.post(
                'https://www.singlemango.com/download/',
                {
                    form: {
                        sName: songName,
                        submit: songID
                    }
                }
            )
                .on('error', function (err) {
                    reject('Failed! Song name: ' + songName);
                })
                .on('end', function (err) {
                    resolve('Download success: ' + songName);
                })
                .pipe(fs.createWriteStream(path + cleaner.cleanString(songName) + '.mp3'));
        }, 2);
    });
}
//Add songs to the playlist
function makePlaylist(playlistName, song, songID) {
    var path = __dirname + '\\Music\\' + Folder + '\\';
    song = cleaner.cleanString(song);
    return new Promise(resolve => {
        setTimeout(() => {
            fs.exists(path + playlistName + '.m3u', (exist) => {
                if (exist) {
                    fs.exists(path + song + '.mp3', async (exist) => {
                        if (!exist) {
                            var status = await download(song, songID);
                            mp3Duration(path + song + '.mp3', function (err, duration) {
                                if (err) return console.log(err.message);
                                fs.appendFile(path + playlistName + '.m3u', '#EXTINF:' + duration + ',' + song + '\r\n' + song + '.mp3\r\n', (err) => {
                                    if (err) throw err;
                                    resolve({ Message: 'Added ' + song + ' to ' + playlistName, Status: status });
                                });
                            });
                        }
                        else {
                            resolve({ Message: 'Song already exist: ' + song, Status: 'Not downloaded again' });
                        }
                    })
                }
            });
        }, 2);
    });
}
//Calls to make the playlist and in turn, download the song.
async function downloadSong(playlistName, song, songID) {
    var playlist = await makePlaylist(playlistName, song, songID);
    console.log(playlist.Status);
    console.log(playlist.Message + '\n');
    return { Message: playlist.Message, DownloadSatatus: playlist.Status };

}
//Entry point. Get things ready for downloading, create the playlist and start the process.
async function getReady(url) {
    var songList = await prepareDownload(url);
    var playlistName = '_' + Folder + ' - Snitlys';
    var playlist = __dirname + '\\Music\\' + Folder + '\\' + playlistName + '.m3u';
    await fs.exists(playlist, async (exist) => {
        if (!exist) {
            await fs.writeFile(playlist, '#EXTM3U' + '\r\n', (err) => {
                if (err) throw err;
                console.log('Created playlist: ' + playlistName + '\n');
                loopDownload(songList, playlistName);
            });
        }
        else {
            console.log('Playlist already exist: ' + playlistName + '\n');
            loopDownload(songList, playlistName);
        }
    });
}
//Looping through the array of songs to be downloaded.
async function loopDownload(songList, playlistName){
    var progress = 0;
    var totalSongs = songList.length;
    var percentage = 0;
    console.log('Songs to download: ' + totalSongs);
    for (const song of songList) {
        await downloadSong(playlistName, song[0], song[1]);
        percentage = parseFloat(((progress + 1) / totalSongs) * 100).toFixed(0);
        progress += 1;
        console.log('Downloaded: ' + progress + ' of ' + totalSongs);
        console.log(percentage + '%');
        global._progress = {Message: 'Aflgelaai: ' + progress + ' van ' + totalSongs, Progress: percentage, Done: false}
    }
    console.log('All Done!');
    global._progress = {Message: 'Liedjies afgelaai: ' + totalSongs, Progress: percentage, Done: true}
}
module.exports = { getReady }