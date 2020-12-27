import React from "react";
import {
  StyleSheet,
  Text,
  ImageBackground,
  TouchableHighlight,
  SafeAreaView,
} from "react-native";
import colors from "../config/colors";

function WelcomeScreen({ navigation }) {
  const graphPress = () => {
    console.log("Pressed Graph!");
    navigation.navigate("GraphingScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        style={styles.background}
        source={require("../assets/Graph_background.gif")}
      />
      <TouchableHighlight style={styles.graphButton} onPress={graphPress}>
        <Text style={styles.buttonText}>Graph!</Text>
      </TouchableHighlight>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    position: "absolute",
  },
  buttonText: {
    color: "white",
    alignSelf: "center",
    fontSize: 20,
  },
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  graphButton: {
    backgroundColor: "blue",
    width: "100%",
    height: 70,
    justifyContent: "center",
  },
});

export default WelcomeScreen;
