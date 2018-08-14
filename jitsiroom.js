let connection = null;
let room = null;

const remoteTracks = {};

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    if (track.isLocal()) {
        return;
    }
    const participant = track.getParticipantId();

    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
    }
    const idx = remoteTracks[participant].push(track);

    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.log('remote track stoped'));
 
	const id = participant + track.getType() + idx;
    if (track.getType() === 'video') {
        $('body').append(
            `<video autoplay='1' id='${participant}video${idx}' />`);
    } else {
        $('body').append(
            `<audio autoplay='1' id='${participant}audio${idx}' />`);
    }
    track.attach($(`#${id}`)[0]);
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    console.log('conference joined!');
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
    console.log('user left id:' + id);
    if (!remoteTracks[id]) {
        return;
    }
	const tracks = remoteTracks[id];
	
    for (let i = 0; i < tracks.length; i++) {
        tracks[i].detach($(`#${id}${tracks[i].getType()}`));
		const idx = i+1;
		$(`#${id}video${idx}`).remove();
		tracks[i].dispose();
    }
	delete remoteTracks[id];
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
	const roomName = connection.roomName;

    room = connection.initJitsiConference(roomName, {});
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
    });
    room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
        console.log('user join id:' + id);
        remoteTracks[id] = [];
		remoteTracks[id].length = 0;
    });
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
    room.join();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
    console.error('Connection Failed!');
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
}

/**
 *
 */
function leave() {
	if (room) {
		room.leave();
		room = null;
	}
    connection.disconnect();
}

function join(serverUrl, roomName) {
	JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.INFO);
	JitsiMeetJS.init({});

	const options = {
		hosts: {
			domain: serverUrl,
			muc: 'conference.' + serverUrl 
		},
		bosh: '//' + serverUrl + '/http-bind',

		clientNode: 'http://jitsi.org/jitsimeet'
	};

	connection = new JitsiMeetJS.JitsiConnection(null, null, options);
	connection.roomName = roomName;

	connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
	connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
	connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);

	connection.connect();
}


