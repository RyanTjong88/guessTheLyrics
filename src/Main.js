import React, { Component } from "react";
import Axios from "axios";
import Spinner from './Spinner';
import firebase from './firebase';  
import swal from 'sweetalert';

class Main extends Component {
  constructor() {
    super();
    this.state = {
      firebaseData: {
        artist: "",
        song: "",
        lyrics: "",
      },
      isLoading: false,
      splitLyrics: [],
      userGuess: '',
      storedFirebaseData: [],
      replayLyrics: []
    }
  }

  //Functions

  //user input, stored into state
  artistInput = (e) => {
    this.setState({
      firebaseData: {
        artist: e.target.value,
        song: this.state.firebaseData.song,
      }
    })
  }

  //user input, stored into state
  songInput = (e)=> {
    this.setState({
      firebaseData: {
        song: e.target.value,
        artist: this.state.firebaseData.artist,
      }
    })
  }

  //Axios call to get lyrics from API
  getLyrics = (e) => {
    e.preventDefault();
    this.setState({
      isLoading: true
    });
    Axios.get(`https://api.lyrics.ovh/v1/${this.state.firebaseData.artist}/${this.state.firebaseData.song}`)
    .then((response) => {

      //Remove unwanted characters from the lyrics and split each word into an array
      const lyrics = response.data.lyrics
      const splitLyrics = lyrics.replace(/\n/g, " ").replace(/\r/g, "").replace("?", " ?").replace(/,/g, " ,").split(" ")
      this.setState({
        firebaseData: {
          artist: this.state.firebaseData.artist,
          song: this.state.firebaseData.song,
          lyrics
        },
        isLoading: false,
        splitLyrics: splitLyrics,
      });

      //error handling for no results
      if (lyrics === "") {
        swal({
          title: "Try again!",
          icon: "error",
          button: "OK",
        });
      }
    })
  }

  // Remove Saved Song
  handleRemove = (dataKey) => {
    // Open portal to Firebase
    const dbRef = firebase.database().ref();
    // Remove data stored in key
    dbRef.child(dataKey).remove(); 
  }
  
  // Store firebaseData: (artist, song, lyrics) to firebase
  firebase = (event) => {
    event.preventDefault();
      this.setState({
        replayLyrics: []
      })
    
    //Error handling for user trying to save empty lyric field to firebase
    if (this.state.firebaseData.lyrics === "") {
      swal({
        title: "Try again!",
        text: "There is no lyrics to save || Song is already saved",
        icon: "error",
        button: "OK",
      })
    } else if (this.state.lyrics !== "") {
    // open portal to Firebase
    const dbRef = firebase.database().ref()
    // add new record to Firebase
    dbRef.push(this.state.firebaseData);
    // reset input field
      this.setState({
        firebaseData: {
          artist: "",
          song: "",
          lyrics: ""
        },
        isLoading: false,
      });
    }
    this.setState({
      firebaseData: {
        artist: "",
        song: "",
        lyrics: ""
      },
      splitLyrics: [],
    });
  }

  //sets state for when user guesses missing lyric
  handleChange = (e) => {
    this.setState({
      userGuess: e.target.value
    })
  }

  //checks userGuess state against the missing lyric
  handleSubmit = (e, word) => {
    e.preventDefault()
    if (this.state.userGuess === word) {
      swal({
        title: "Good job!",
        text: "On to the next!",
        icon: "success",
        button: "Let's Go!",
      })
    } else  {
      swal({
        title: "OOPS!",
        text: "Incorrect word!",
        icon: "error",
        button: "Try again!",
      });
    }
  }

  //Displays lyrics saved in firebase to play again
  replayLyrics = (props) => {
    this.setState({
      splitLyrics: []
    })
    const lyrics = props
    const splitLyrics = lyrics.replace(/\n/g, " ").replace(/\r/g, "").replace("?", " ?").replace(/,/g, " ,").split(" ")
    this.setState({
      replayLyrics: splitLyrics
    })
  }

  componentDidMount() {
    // create a Firebase reference
    const dbRef = firebase.database().ref();
    // listen to the value change and use `response` as the db value
    dbRef.on('value', (response) => {
      // clean up data from Firebase and store in state
      const storedFirebaseData = [];
      const data = response.val();

      for(let key in data) {
        storedFirebaseData.push({
            key: key, 
            artistSongLyrics: data[key]
        });  
      }
      this.setState({
          storedFirebaseData
      });
    });
  }

  render(){
    return(
      <main>
        <div className="wrapper mainContainer">
        {/* Left */}
          <section className="left">
            <div className="findLyrics">
              <h3>Test your knowledge!</h3>
              <form onSubmit={this.getLyrics} action="">
                {/* Artist Container */}
                <div className="artist">
                  <label htmlFor="artist">Artist:</label>
                  <input
                    placeholder="Artist"
                    aria-label="Artist name"
                    required
                    type="text"
                    id="artist"
                    className="artist"
                    onChange={this.artistInput}
                    value={this.state.firebaseData.artist}
                  />
                </div>
                {/* Song Container */}
                <div className="song">
                  <label htmlFor="song">Song:</label>
                  <input
                    placeholder="Song"
                    aria-label="Song name"
                    required
                    type="text"
                    id="song"
                    className="song"
                    onChange={this.songInput}
                    value={this.state.firebaseData.song}
                  />
                </div>
                {/* Submit Button Container */}
                <div className="buttonContainer">
                  <button type="submit">Find the lyric</button>
                </div>
              </form>
            </div>

            {/* My Lyrics Container */}
            <div on className="myLyrics">
              <div className="logoContainer">
                <img src="./assets/myLyricsButton.jpg" alt=""></img>
              </div>
              <h3>My Lyrics</h3>

              {this.state.storedFirebaseData.map((data, index) => {
                const lyricsFrom = data.artistSongLyrics.lyrics
                return (
                  <div className="allSavedSongs">
                    <div className="savedSongs" key={index}>
                      <button onClick={() => this.replayLyrics(lyricsFrom)} test={lyricsFrom}>
                        {data.artistSongLyrics.artist.toUpperCase()} - {data.artistSongLyrics.song.toUpperCase()}
                      </button>
                          
                      <button 
                        onClick={() => this.handleRemove(data.key)}
                        className="">
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

          </section>
          {/* Right */}
          <section className="right">
            <form action="">
              <div className="lyrics" defaultValue="">
              {this.state.isLoading 
                ? 
                  (
                    <div className="artSpinnerBox">
                      <Spinner />
                    </div>
                  ) 
                : 
                  //Maps over the split lyrics array and either creates an input or returns the word in the array
                  this.state.splitLyrics.map((word, index) => {
                    const hide = this.state.splitLyrics;
                    for (let i = 10; i < hide.length; i+=32) {
                      if ( index === i ) {
                        return (
                        <form onSubmit={(e) => this.handleSubmit(e, word)} action="">
                          <input onChange={this.handleChange}/>
                        </form>)
                      }
                    }
                    return word + " "
                  })}

                {this.state.replayLyrics.map((word, index) => {
                  const hide = this.state.replayLyrics;
                  for (let i = 10; i < hide.length; i+=32) {
                    if ( index === i ) {
                      return (
                      <form onSubmit={(e) => this.handleSubmit(e, word)} action="">
                        <input word={word} onChange={this.handleChange}/>
                      </form>)
                    }
                  }
                  return word + " "
                })}
                
              </div>
              <div className="buttonContainer">
                <button onClick={this.firebase} className="saveLyrics">
                  Store lyrics
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    )
  }
}
export default Main;