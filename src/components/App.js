/**
 * @format
 * @flow
 */

import React, {Fragment, Component} from 'react';
import {
  Button,
  FlatList,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  StatusBar,
} from 'react-native';

const { Stitch, AnonymousCredential } = require('mongodb-stitch-react-native-sdk');
const MongoDB = require('mongodb-stitch-react-native-services-mongodb-remote');

/*
var NativeAppEventEmitter = require('RCTNativeAppEventEmitter');
*/

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUserId: undefined,
      client: undefined,
      atlasClient: undefined,
      items: undefined,
      todos: [],
      text: "",
    };
    this._loadClient = this._loadClient.bind(this);
    this._getItems = this._getItems.bind(this);
    this.displayTodos = this.displayTodos.bind(this);
    this.addTodo = this.addTodo.bind(this);
  }

  componentDidMount() {
    this._loadClient();
  }

  _loadClient() {
    Stitch.initializeDefaultAppClient("todo-jxmae").then(client => {
      this.setState({ client });
      this.state.client.auth
        .loginWithCredential(new AnonymousCredential())
        .then(user => {
          console.log(`Successfully logged in as user ${user.id}`);
          this.setState({ currentUserId: client.auth.user.id });
        })
        .catch(err => {
          console.log(`Failed to log in anonymously: ${err}`);
          this.setState({ currentUserId: undefined });
        });
        this._getItems();
    });
  }

  _getItems() {
    const stitchAppClient = Stitch.defaultAppClient;
    const mongoClient = stitchAppClient.getServiceClient(
      MongoDB.RemoteMongoClient.factory,
      "mongodb-atlas"
    );
    this.setState({items: mongoClient.db("todo").collection("items")});
  }

  displayTodos() {
    this.state.items
      .find({}, {limit: 1000})
      .asArray()
      .then(todos => {
        this.setState({todos});
      });
  }

  addTodo(event) {
    event.preventDefault();
    const { text } = this.state;
    const itemToAdd = {"owner_id" : this.state.currentUserId, "item" : text};
    this.state.items
      .insertOne(itemToAdd)
      .then(this.displayTodos)
      .catch(console.error);
  }

  render() {
    return(
      <Fragment>
      <ScrollView>
        <Text>This is a To-Do App</Text>
        <Text>Add a Todo Item:</Text>
            <TextInput
              placeholder="Enter To-Do Item"
              onBlur={Keyboard.dismiss}
              value={this.state.text}
              onChangeText={(text) => this.setState({ text })}
            />
            <Button
              onPress={this.addTodo}
              title="Add Todo"
            />
            <View>
              {this.state.todos.map((todo) => {
                return (<Text>{todo.item}</Text>);
              })}
            </View>
      </ScrollView>
      </Fragment>
    );
  }
}

export default App;
