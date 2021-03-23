const INITIAL_STATE = {
  rtcId: null,
  stream: null,
  local: null,
  muteVideoForMe: false,
  muteVideoForAll: false,
  muteAudioForMe: false,
  muteAudioForAll: false,
  videoBitrate: null,
  audioBitrate: null
};

export default class VideoComponent {
  constructor(el) {
    this.state = { ...INITIAL_STATE };

    this.onMakeLeaderCallback = null;
    this.onMuteVideoForMeCallback = null;
    this.onMuteVideoForAllCallback = null;
    this.onMuteAudioForMeCallback = null;
    this.onMuteAudioForAllCallback = null;

    this.el = el;
    this.videoEl = el.getElementsByTagName('video')[0];
    this.makeLeaderBtnEl = el.getElementsByClassName('make-leader-btn')[0];
    this.muteVideoForMeBtnEl = el.getElementsByClassName('mute-video-for-me-btn')[0];
    this.muteVideoForAllBtnEl = el.getElementsByClassName('mute-video-for-all-btn')[0];
    this.muteAudioForMeBtnEl = el.getElementsByClassName('mute-audio-for-me-btn')[0];
    this.muteAudioForAllBtnEl = el.getElementsByClassName('mute-audio-for-all-btn')[0];
    this.rtcIdEl = el.getElementsByClassName('rtc-id')[0];
    this.videoBitrateEl = el.getElementsByClassName('video-bitrate')[0];
    this.audioBitrateEl = el.getElementsByClassName('audio-bitrate')[0];

    if (this.makeLeaderBtnEl) {
      this.makeLeaderBtnEl.addEventListener('click', this._onMakeLeaderBtnClick.bind(this));
    }

    this.muteVideoForMeBtnEl.addEventListener('click', this._onMuteVideoForMeBtnClick.bind(this));
    this.muteVideoForAllBtnEl.addEventListener('click', this._onMuteVideoForAllBtnClick.bind(this));
    this.muteAudioForMeBtnEl.addEventListener('click', this._onMuteAudioForMeBtnClick.bind(this));
    this.muteAudioForAllBtnEl.addEventListener('click', this._onMuteAudioForAllBtnClick.bind(this));
  }

  onMakeLeader(callback) {
    this.onMakeLeaderCallback = callback;
  }

  onMuteVideoForMe(callback) {
    this.onMuteVideoForMeCallback = callback;
  }

  onMuteVideoForAll(callback) {
    this.onMuteVideoForAllCallback = callback;
  }

  onMuteAudioForMe(callback) {
    this.onMuteAudioForMeCallback = callback;
  }

  onMuteAudioForAll(callback) {
    this.onMuteAudioForAllCallback = callback;
  }

  //////////////////////////////////////////////////////////////////////////////

  getRtcId() {
    return this.state.rtcId;
  }

  setRtcId(rtcId) {
    this._setState({ rtcId })
  }

  reset() {
    this._setState({ ...INITIAL_STATE });
  }

  setStream(stream, local) {
    this._setState({ stream, local });
  }

  swap(otherVideoComponent) {
    let bufferState = { ...this.state };
    this._setState(otherVideoComponent.state);
    otherVideoComponent._setState(bufferState);
  }

  applyAgentReaderConfig(config) {
    this._setState({
      muteVideoForMe: !config.receive_video,
      muteAudioForMe: !config.receive_audio
    });
  }

  applyAgentWriterConfig(config) {
    this._setState({
      muteVideoForAll: !config.send_video,
      muteAudioForAll: !config.send_audio
    });
  }

  setStats(report) {
    this._setState({
      videoBitrate: report.videoBitrate,
      audioBitrate: report.audioBitrate,
    })
  }

  isFree() {
    return !this.state.rtcId;
  }

  //////////////////////////////////////////////////////////////////////////////

  async _onMakeLeaderBtnClick() {
    if (this.onMakeLeaderCallback) await this.onMakeLeaderCallback(this.state.rtcId);
  }

  async _onMuteVideoForMeBtnClick() {
    let newValue = !this.state.muteVideoForMe;

    if (this.onMuteVideoForMeCallback) {
      await this.onMuteVideoForMeCallback(this.state.rtcId, newValue);
    }

    this._setState({ muteVideoForMe: newValue });
  }

  async _onMuteVideoForAllBtnClick() {
    let newValue = !this.state.muteVideoForAll;

    if (this.onMuteVideoForAllCallback) {
      await this.onMuteVideoForAllCallback(this.state.rtcId, newValue);
    }

    this._setState({ muteVideoForAll: newValue });
  }

  async _onMuteAudioForMeBtnClick() {
    let newValue = !this.state.muteAudioForMe;

    if (this.onMuteAudioForMeCallback) {
      await this.onMuteAudioForMeCallback(this.state.rtcId, newValue);
    }

    this._setState({ muteAudioForMe: newValue });
  }

  async _onMuteAudioForAllBtnClick() {
    let newValue = !this.state.muteAudioForAll;

    if (this.onMuteAudioForAllCallback) {
      await this.onMuteAudioForAllCallback(this.state.rtcId, newValue);
    }

    this._setState({ muteAudioForAll: newValue });
  }

  //////////////////////////////////////////////////////////////////////////////

  _setState(stateDiff) {
    this.state = Object.assign(this.state, stateDiff);
    this._syncDOMToState();
  }

  _syncDOMToState() {
    let videoTrack = this.state.stream && this.state.stream.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = !this.state.muteVideoForAll && !this.state.muteVideoForMe;
    
    let audioTrack = this.state.stream && this.state.stream.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = !this.state.muteAudioForAll && !this.state.muteAudioForMe;
    
    this.videoEl.muted = this.state.local;
    if (this.videoEl.srcObject !== this.state.stream) this.videoEl.srcObject = this.state.stream;
    this.constructor._toggleBtnState(this.muteVideoForMeBtnEl, !this.state.muteVideoForMe);
    this.constructor._toggleBtnState(this.muteVideoForAllBtnEl, !this.state.muteVideoForAll);
    this.constructor._toggleBtnState(this.muteAudioForMeBtnEl, !this.state.muteAudioForMe);
    this.constructor._toggleBtnState(this.muteAudioForAllBtnEl, !this.state.muteAudioForAll);

    this.rtcIdEl.innerText = this.state.rtcId || 'N/A';
    this.videoBitrateEl.innerText = this.constructor._formatBitrate(this.state.videoBitrate);
    this.audioBitrateEl.innerText = this.constructor._formatBitrate(this.state.audioBitrate);
  }

  static _toggleBtnState(btn, value) {
    btn.classList.toggle('on', value);
    btn.classList.toggle('off', !value);
  }

  static _formatBitrate(value) {
    if (value === null) return 'N/A';
    return `${Math.round(value / 1000)} kbps`;
  }
}