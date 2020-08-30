import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Image, Button } from 'react-native';
import * as SQLite from 'expo-sqlite';
import axios from 'axios';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      chunk: 10,
      chunks: {},
      pageNumber: 0,
    };
  }
  componentDidMount = async () => {
    const { chunk } = this.state;
    const { data: images } = await axios.get(
      'https://picsum.photos/v2/list?limit=100'
    );
    console.log('images', images);

    const db = SQLite.openDatabase('demo', '1.0');
    db.transaction(async (tx) => {
      try {
        await this.dropTable(tx);
        await this.createTable(tx);
        const promises = this.insertImages(tx, images);
        await Promise.all(promises);
        const dbImages = await this.getImages(tx);
        const chunks = {};
        const totalChunks = Object.keys(dbImages).length / chunk;
        for (let i = 0; i < totalChunks; i++) {
          const chunkId = i + chunk;
          for (let j = 0; j < chunk; j++) {
            const id = chunkId + j;
            if (!chunks[i]) chunks[i] = [];
            chunks[i].push(dbImages[id]);
          }
        }
        console.log(chunks);
        this.setState({ images: dbImages, chunks });
      } catch (e) {
        console.log(e);
      }
    }, []);
  };

  getImages = (tx) => {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        'SELECT * from images',
        [],
        (_, { rows }) => {
          resolve(JSON.parse(JSON.stringify(rows)));
        },
        (a, b) => {
          reject(e);
        }
      );
    });
  };

  insertImages = (tx, images) => {
    console.log('table creation');
    const insertSchema = `
    INSERT INTO images (url) values (?)
    `;
    return images.map((img) => {
      // console.log('insert', img.download_url);
      return new Promise((resolve, reject) => {
        tx.executeSql(
          insertSchema,
          [img.download_url],
          () => {
            resolve();
          },
          (a, b) => {
            reject(b);
          }
        );
      });
    });
  };
  createTable = (tx) => {
    return new Promise((resolve, reject) => {
      const tableSchema = `
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL
      );
      `;
      tx.executeSql(
        tableSchema,
        null,
        () => {
          resolve();
        },
        (a, b) => {
          reject(b);
        }
      );
    });
  };
  dropTable = (tx) => {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        'DROP TABLE IF EXISTS images',
        [],
        () => {
          resolve();
        },
        (a, b) => {
          reject(b);
        }
      );
    });
  };

  renderImages = (image1, image2) => {
    return (
      <View style={styles.imageWrapper}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{
              uri: image1.url,
            }}
          />
        </View>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{
              uri: image2.url,
            }}
          />
        </View>
      </View>
    );
  };

  loadImageInChunk = () => {
    const { pageNumber, chunks } = this.state;
    const images = chunks[pageNumber];
    if (!images) return <View></View>;
    return (
      <View>
        {this.renderImages(images[0], images[1])}
        {this.renderImages(images[2], images[3])}
        {this.renderImages(images[4], images[5])}
        {this.renderImages(images[6], images[7])}
        {this.renderImages(images[8], images[9])}
      </View>
    );
  };

  render() {
    const { pageNumber } = this.state;
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        {this.loadImageInChunk()}
        <View style={styles.buttonWrapper}>
          <View style={{ marginRight: 10 }}>
            <Button
              title="Prev"
              onPress={() => {
                this.setState({ pageNumber: pageNumber - 1 });
              }}
            />
          </View>
          <View>
            <Button
              title="next"
              onPress={() => this.setState({ pageNumber: pageNumber + 1 })}
            />
          </View>
        </View>
      </View>
    );
  }
}
export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    flex: 2,
    flexDirection: 'row',
  },
  imageContainer: {
    padding: 10,
  },
  image: {
    resizeMode: 'cover',
    width: 200,
    height: 200,
  },
  buttonWrapper: {
    flexDirection: 'row',
  },
});
