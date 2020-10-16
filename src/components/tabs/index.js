import React, {Fragment, useState, useEffect} from "react";
import { withRouter } from 'react-router-dom'
import {Tabs, Spin} from "antd";
import Visualizer from "../visualizer"
import {
    RESULT_ADDR,
} from "../../service";

const TabPane = Tabs.TabPane;

function TabbedViz(props) {
    const [goGraph, setGOGraph] = useState(null);
    const [nonGOGraph, setNonGoGraph] = useState(null);
    const [isFetchingResult, setFetchingResult] = useState(false);
    const id = props.match.params.id;

    useEffect(() => {
        if (id) {
            setFetchingResult(true);
            fetch(`${RESULT_ADDR}/${id}`)
                .then((res) => res.json())
                .then((result) => {
                    if (result.go) {
                        fetch(`${RESULT_ADDR}/${id}/go`)
                            .then((res) => res.json())
                            .then((result) => {
                                setGOGraph(result);
                            });
                    }
                    if (result.nongo) {
                        fetch(`${RESULT_ADDR}/${id}/nongo`)
                            .then((res) => res.json())
                            .then((result) => {
                                setNonGoGraph(result);
                            });
                    }
                    setFetchingResult(false);
                });
        }
    }, []);

    return (
        <div className="content-wrapper" style={{ "top": 0, "left": 0}}>
            {isFetchingResult && (
                <div className="spin-wrapper">
                    <Spin/> Fetching results ...
                </div>
            )}
            <Tabs defaultActiveKey="1">
                {nonGOGraph != null &&
                <TabPane tab="Main Graph" key="1">
                    <Visualizer isGO={false} graph={{...nonGOGraph.elements}}
                                annotations={nonGOGraph.elements.nodes
                                    .reduce(
                                        (acc, n) => [...acc, ...n.data.group, n.data.type],
                                        []
                                    )
                                    .filter((a, i, self) => a && self.indexOf(a) === i)}/>
                    {/*Main Graph*/}
                </TabPane>
                }
                {goGraph != null &&
                <TabPane tab="GO" key="2">
                    <Visualizer isGO={true} graph={{...goGraph.elements}}
                                annotations={goGraph.elements.nodes
                                    .reduce(
                                        (acc, n) => [...acc, ...n.data.group, n.data.type],
                                        []
                                    )
                                    .filter((a, i, self) => a && self.indexOf(a) === i)}/>
                    {/*GO */}
                </TabPane>
                }
            </Tabs>
        </div>
    )
}

export default TabbedViz;
