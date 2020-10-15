import React, { Component } from "react";
import Axios from "axios";
import Spinner from './Spinner';
import firebase from './firebase';  
import swal from 'sweetalert';
import Lyrics from './Lyrics';

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
      replayLyrics: [],
      difficulty: 60,
    }
  }

  //FUNCTIONS

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
          title: " try again!",
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
  test = (e) => {
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
  replayLyrics = (replay) => {
    this.setState({
      splitLyrics: []
    })
    const lyrics = replay
    const splitLyrics = lyrics.replace(/\n/g, " ").replace(/\r/g, "").replace(/\?/g, " ?").replace(/\,/g, " ,").split(" ")
    this.setState({
      replayLyrics: splitLyrics
    })
  }

  difficulty = (e) => {
    const difficultyNumber = parseInt(e.target.value, 10)
    this.setState({
      difficulty: difficultyNumber,
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
      <main id="main">
        <div className="wrapper mainContainer">
        {/* One */}
          <section className="containerOne">
            <div className="findLyrics">
              <div className="inputContainer">
                <h1>Test your knowledge!</h1>
  
                <form onSubmit={this.getLyrics} action="">
  
                  <div className="artist">
                    <label htmlFor="artist">Artist:</label>
                    <input
                      required
                      type="text"
                      id="artist"
                      className="artist"
                      placeholder="Artist"
                      aria-label="artist"
                      onChange={this.artistInput}
                      value={this.state.firebaseData.artist}
                    />
                  </div>
  
                  <div className="song">
                    <label htmlFor="song">Song:</label>
                    <input
                      required
                      type="text"
                      id="song"
                      className="song"
                      placeholder="Song"
                      aria-label="song"
                      onChange={this.songInput}
                      value={this.state.firebaseData.song}
                    />
                  </div>
  
                  <div className="buttonContainer">
                    <button type="submit">Find lyrics</button>
                  </div>
                </form>
              </div>

              <div className="difficultyContainer">
                <h1>Difficulty</h1>
                <div className="buttonContainer">
                  <button onClick={this.difficulty} value="55">Easy</button>
                  <button onClick={this.difficulty} value="35" >Medium</button>
                  <button onClick={this.difficulty} value="15">Hard</button>
                </div>
              </div>
            </div>

            <div className="myLyrics">
              <div className="logoContainer">
                <img src="./assets/myLyricsButton.jpg" alt=""></img>
              </div>
              <h1>My Lyrics</h1>

              {this.state.storedFirebaseData.map((data, index) => {
                const lyricsFrom = data.artistSongLyrics.lyrics
                return (
                  <div className="allSavedSongs" key={index}>
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
          {/* Two */}
          <section className="containerTwo">
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
                    <Lyrics lyrics={this.state.splitLyrics} submit={(e, word) => this.handleSubmit(e, word)} change={this.test} difficulty={this.state.difficulty} />
                }

                <Lyrics lyrics={this.state.replayLyrics} submit={(e, word) => this.handleSubmit(e, word)} change={this.test} difficulty={this.state.difficulty} />
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