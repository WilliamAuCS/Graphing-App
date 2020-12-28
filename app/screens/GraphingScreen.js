// Imports
import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableHighlight,
  SafeAreaView,
} from "react-native";
import { Button, Overlay } from "react-native-elements";
import {
  Chart,
  Line,
  Area,
  HorizontalAxis,
  VerticalAxis,
} from "react-native-responsive-linechart";
import io from "socket.io-client";
import DropDownPicker from "react-native-dropdown-picker";
import Icon from "react-native-vector-icons/Feather";
import colors from "../config/colors";
import { ScrollView } from "react-native-gesture-handler";

class GraphingScreen extends Component {
  first_run = true;
  _isMounted = false;
  compare = false;
  xvaluesOnScreen = 21;
  socketCounter = 0;
  compareCounter = 0;
  abnormalityLog = "";
  SERVER_URL = "http://server.makosusa.com:7070";

  // Initial state
  state = {
    overlayOpen: false,
    options: {
      dataset: "random",
      graphingType: "normal",
    },
    compareData: 0,

    data: [
      {
        x: 0,
        y: 0,
      },
    ],
    compareDataPoints: [
      {
        x: 0,
        y: 0,
      },
    ],
    minY: 0,
    maxY: 10,
    minIndex: 0,
    maxIndex: this.xvaluesOnScreen,
    // compare: false,
  };
  componentDidMount() {
    this._isMounted = true;
    this.socket = io(this.SERVER_URL);

    // Receiving data from server socket
    this.socket.on("graphData", (gdata) => {
      // Temp variable holding received data
      let tmp = {
        x: gdata.time,
        y: gdata.graph_data,
      };
      ++this.socketCounter;

      // Ensuring socket is kept alive
      if (this.socketCounter >= 5) {
        this.socketCounter = 0;
        this.socket.emit("renewChannel");
      }

      // Scale y-axis based on select dataset
      if (
        this.state.options.dataset === "dataset2" ||
        this.state.options.dataset === "dataset3"
      ) {
        this.setState(
          {
            minY: -0.5,
            maxY: 1.2,
            compareData: gdata.compare,
          },
          () => {
            // If compare is selected, run comparison function
            if (this.state.options.graphingType === "compare")
              this.compareECG(tmp.x, tmp.y, this.state.compareData);
          }
        );
      } else {
        // Reset scaling if needed
        this.setState({
          minY: 0,
          maxY: 10,
        });
      }

      // Push data to array
      let tmpData = Array.from(this.state.data);
      tmpData.push(tmp);

      // Push comparison data to array
      let tmpCompareData = Array.from(this.state.compareDataPoints);
      if (this.state.options.graphingType === "compare") {
        tmpCompareData.push({
          x: gdata.time,
          y: gdata.compare,
        });
      }

      // If array limit is reached, pop first element in respective array(s)
      if (tmpData.length > this.xvaluesOnScreen) {
        tmpData.shift();
        if (this.state.options.graphingType === "compare") {
          tmpCompareData.shift();
        }
      }

      // Setting max
      if (tmp.x > this.xvaluesOnScreen) {
        this.setState({
          data: tmpData,
          minIndex: tmp.x - this.xvaluesOnScreen + 1,
          maxIndex: tmp.x,
          compareDataPoints: tmpCompareData,
        });
      } else {
        this.setState({
          data: tmpData,
          compareDataPoints: tmpCompareData,
        });
      }
    });
  }

  // Comparing data
  compareECG(x, y, toCompare) {
    if (
      Math.abs(y * 1.3) >= Math.abs(toCompare) &&
      Math.abs(y * 0.7) <= Math.abs(toCompare)
    ) {
      return;
    }
    this.abnormalityLog += "Data abnormality found at (" + x + "," + y + ")\n";
  }

  // Show/disable array depending on if comparison is selected
  toggleOverlay() {
    this.setState({
      overlayOpen: !this.state.overlayOpen,
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // Alter graph when options are submitted
  graphButton() {
    this.socket.emit("graphOptions", this.state.options);
    this.resetGraph();
    this.first_run = true;
    this.pressedStop();
  }

  // Reset graph to origin attributes
  resetGraph() {
    this.setState({
      data: [
        {
          x: 0,
          y: 0,
        },
      ],
      compareDataPoints: [
        {
          x: 0,
          y: 0,
        },
      ],

      maxIndex: this.xvaluesOnScreen,
      minIndex: 0,
    });
    this.abnormalityLog = "";
  }

  // Start graph
  pressedStart() {
    if (this.first_run === true) {
      this.first_run = false;
    }
    this.socket.emit("startGraph");
  }

  // Stop graph
  pressedStop() {
    this.socket.emit("stopGraph");
  }

  render() {
    return (
      <SafeAreaView>
        <ScrollView style={styles.background}>
          {/* Settings pannel */}
          <View>
            <Button
              title="Settings"
              onPress={() => {
                this.toggleOverlay();
              }}
            />
            <Overlay
              overlayStyle={styles.overlay}
              isVisible={this.state.overlayOpen}
              onBackdropPress={() => {
                this.toggleOverlay();
              }}
            >
              <View style={styles.optionContainer}>
                <Text style={styles.titleText}>Graphing Options</Text>
                <View style={[styles.dropdownContainer, { zIndex: 10 }]}>
                  <Text style={styles.dropdownTitle}>Dataset</Text>
                  <DropDownPicker
                    items={[
                      {
                        label: "Random",
                        value: "random",
                        icon: () => <Icon name="flag" size={18} color="#900" />,
                        hidden: true,
                      },
                      {
                        label: "Dataset1",
                        value: "dataset1",
                        icon: () => <Icon name="flag" size={18} color="#900" />,
                      },
                      {
                        label: "Dataset2",
                        value: "dataset2",
                        icon: () => <Icon name="flag" size={18} color="#900" />,
                      },
                      {
                        label: "Dataset3",
                        value: "dataset3",
                        icon: () => <Icon name="flag" size={18} color="#900" />,
                      },
                    ]}
                    defaultValue={this.state.options.dataset}
                    dropDownStyle={styles.dropdownBackground}
                    containerStyle={styles.dropdown}
                    onChangeItem={(item) =>
                      this.setState({
                        options: {
                          dataset: item.value,
                          graphingType: this.state.options.graphingType,
                        },
                      })
                    }
                  ></DropDownPicker>
                </View>
                <View style={[styles.dropdownContainer, { zIndex: 9 }]}>
                  <Text style={styles.dropdownTitle}>Graphing Type</Text>
                  <DropDownPicker
                    items={[
                      {
                        label: "Normal",
                        value: "normal",
                        icon: () => <Icon name="flag" size={18} color="#900" />,
                        hidden: true,
                      },
                      {
                        label: "Compare",
                        value: "compare",
                        icon: () => <Icon name="flag" size={18} color="#900" />,
                      },
                    ]}
                    defaultValue={this.state.options.graphingType}
                    dropDownStyle={styles.dropdownBackground}
                    containerStyle={styles.dropdown}
                    onChangeItem={(item) => {
                      this.setState({
                        options: {
                          dataset: this.state.options.dataset,
                          graphingType: item.value,
                        },
                      });
                    }}
                  ></DropDownPicker>
                </View>
                <TouchableHighlight
                  style={styles.readyButton}
                  onPress={() => {
                    this.graphButton();
                  }}
                >
                  <Text style={styles.buttonText}>Set!</Text>
                </TouchableHighlight>
              </View>
            </Overlay>
          </View>
          {/* /Settings pannel */}

          {/* Graph */}
          <Text style={styles.graphTitle}>Graph</Text>

          <Chart
            style={styles.chart}
            data={this.state.data}
            padding={{ left: 40, bottom: 20, right: 20, top: 20 }}
            xDomain={{ min: this.state.minIndex, max: this.state.maxIndex }}
            yDomain={{ min: this.state.minY, max: this.state.maxY }}
          >
            <VerticalAxis
              tickCount={8}
              theme={{
                labels: {
                  formatter: (v) => v.toFixed(2),
                  label: { color: colors.white },
                },
              }}
            />
            <HorizontalAxis
              tickCount={this.xvaluesOnScreen}
              theme={{
                labels: {
                  formatter: (v) => v.toFixed(0),
                  label: { color: colors.white },
                },
              }}
            />
            <Area
              theme={{
                gradient: {
                  from: { color: "#ffa502" },
                  to: { color: "#ffa502", opacity: 0.24 },
                },
              }}
            />
            <Line
              theme={{
                stroke: { color: "#ffa502", width: 5 },
                scatter: { default: { width: 4, height: 4, rx: 2 } },
              }}
            />
          </Chart>
          {/* /Graph */}

          {/* Start/Stop buttons */}
          <View style={styles.buttonBackground}>
            <TouchableHighlight
              style={styles.startButton}
              onPress={() => this.pressedStart()}
            >
              <Text style={styles.buttonText}>Start</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={styles.stopButton}
              onPress={() => this.pressedStop()}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableHighlight>
          </View>
          {/* Start/Stop buttons */}

          {/* Compare Grpah */}
          <View opacity={this.state.graphingType === "compare" ? 0 : 100}>
            {this.state.options.graphingType === "compare" ? (
              <Text style={styles.graphTitle}>Comparison</Text>
            ) : null}
            {this.state.options.graphingType === "compare" ? (
              <Chart
                style={styles.chart}
                data={this.state.compareDataPoints}
                padding={{ left: 40, bottom: 20, right: 20, top: 20 }}
                xDomain={{ min: this.state.minIndex, max: this.state.maxIndex }}
                yDomain={{ min: this.state.minY, max: this.state.maxY }}
              >
                <VerticalAxis
                  tickCount={8}
                  theme={{
                    labels: {
                      formatter: (v) => v.toFixed(2),
                      label: { color: colors.white },
                    },
                  }}
                />
                <HorizontalAxis
                  tickCount={this.xvaluesOnScreen}
                  theme={{
                    labels: {
                      formatter: (v) => v.toFixed(0),
                      label: { color: colors.white },
                    },
                  }}
                />
                <Area
                  theme={{
                    gradient: {
                      from: { color: "#ffa502" },
                      to: { color: "#ffa502", opacity: 0.24 },
                    },
                  }}
                />
                <Line
                  theme={{
                    stroke: { color: "#ffa502", width: 5 },
                    scatter: { default: { width: 4, height: 4, rx: 2 } },
                  }}
                />
              </Chart>
            ) : null}
            <Text style={{ color: colors.white }}>{this.abnormalityLog}</Text>
          </View>
          {/* /Compare Grpah */}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export default GraphingScreen;

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.primary,
    height: "100%",
  },
  buttonBackground: {
    backgroundColor: colors.secondary,
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    color: "white",
    alignSelf: "center",
    fontSize: 20,
  },
  chart: {
    height: 220,
    width: 425,
  },
  dropdown: {
    width: "80%",
    height: 30,
    marginTop: 10,
  },
  dropdownBackground: {
    backgroundColor: colors.white,
    top: "15%",
  },
  dropdownContainer: {
    backgroundColor: colors.secondary,
    height: "22%",
    width: "100%",
    alignItems: "center",
  },
  dropdownTitle: {
    color: colors.white,
    fontSize: 17,
  },
  graphTitle: {
    color: colors.white,
    fontSize: 25,
    alignSelf: "center",
    paddingTop: 5,
  },
  optionContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
    justifyContent: "center",
  },
  overlay: {
    height: "40%",
    backgroundColor: colors.secondary,
  },
  readyButton: {
    backgroundColor: "green",
    width: "100%",
    height: 50,
    justifyContent: "center",
  },
  startButton: {
    backgroundColor: "green",
    width: "100%",
    height: 50,
    justifyContent: "center",
  },
  stopButton: {
    backgroundColor: "red",
    width: "100%",
    height: 50,
    justifyContent: "center",
  },
  titleText: {
    color: colors.white,
    fontSize: 25,
    alignSelf: "center",
    paddingBottom: "2%",
  },
});
