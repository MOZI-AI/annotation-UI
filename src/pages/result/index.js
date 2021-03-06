import React, {useState, useEffect, Fragment} from "react";
import {HashRouter as Router, Route, Link, Redirect} from "react-router-dom";
import {
    Button,
    Alert,
    Spin,
    Typography,
    Tabs,
    Modal,
    Table,
} from "antd";
import {DownloadOutlined, ArrowLeftOutlined} from "@ant-design/icons"
import {
    RESULT_ADDR,
    downloadSchemeFile,
    downloadCSVfiles,
} from "../../service";
import TabbedTables from "../../components/result-tables";
import TabbedViz from "../../components/tabs";
import Header from "../../components/header";
import sessionNotFound from "../../assets/session-not-found.svg";
import "./style.css";

const width = document.body.clientWidth || window.screen.width;

// export const AnnotationStatus = {
//   ACTIVE: 1,
//   COMPLETED: 2,
//   ERROR: -1
// };

function AnnotationResult(props) {
    const [response, setResponse] = useState(undefined);
    const [isTableShown, setTableShown] = useState(false);

    const [summary, setSummary] = useState(undefined);
    const [isSummaryShown, setSummaryShown] = useState(false);
    // const { ACTIVE, COMPLETED, ERROR } = AnnotationStatus;
    const id = props.match.params.id;


    const fetchTableData = (fileName) => {
        fetch(
            `${RESULT_ADDR}/csv_file/${id}/${fileName.substr(0, fileName.length - 4)}`
        ).then((data) => {
            const res = Object.assign({}, response);
            data
                .clone()
                .text()
                .then((text) => {
                    res.csv_files.find((f) => f.fileName === fileName).data = text;
                    setResponse(res);
                });
        });
    };

    // const renderActive = () => (
    //   <Alert
    //     type="info"
    //     message="The annotation task is still processing, refresh the page to check again."
    //     showIcon
    //   />
    // );

    // const renderError = () => (
    //   <Fragment>
    //     <img src={sessionNotFound} className="empty-state" />
    //     <Typography.Paragraph className="call-to-action">
    //       <Alert
    //         type="error"
    //         message={
    //           <span>
    //             {
    //               <span>
    //                 {response.statusMessage}. Try to
    //                 <Link to="/"> run another annotation</Link>
    //               </span>
    //             }
    //           </span>
    //         }
    //         showIcon
    //       />
    //     </Typography.Paragraph>
    //   </Fragment>
    // );

    const renderComplete = () => {
        return (
            <Fragment>
                {/*<p>*/}
                {/*  The result contains {nodes.length} entities and {edges.length}{" "}*/}
                {/*  connections between them.*/}
                {/*  <br />*/}
                {/*  /!* This page will expire in{" "}*/}
                {/*  {distanceInWordsToNow(parse(response.expire_time * 1000))}. *!/*/}
                {/*</p>*/}
                <div className="inline-buttons">
                    <Button
                        onClick={(e) => {
                            if (!summary) {
                                fetch(`${RESULT_ADDR}/summary/${id}`).then((data) => {
                                    data
                                        .clone()
                                        .text()
                                        .then((t) => {
                                            setSummary(JSON.parse(t));
                                        });
                                });
                            }
                            setSummaryShown(true);
                        }}
                    >
                        View summary
                    </Button>

                    <Button onClick={() => downloadCSVfiles(props.match.params.id)}>
                        Download CSV files
                    </Button>
                    <Button onClick={() => downloadSchemeFile(props.match.params.id)}>
                        Download Scheme File
                    </Button>
                    <Button type="primary" onClick={(e) => {
                        props.history.push({
                            pathname: `/visualizer/${id}`,
                        });
                    }}>
                        Visualize the result
                    </Button>
                </div>
                <Typography.Paragraph className="call-to-action">
                    <Link to="/">
                        <ArrowLeftOutlined/>
                        Run another annotation
                    </Link>
                </Typography.Paragraph>
            </Fragment>
        );
    };

    const renderSummaryTable = (tableData) => {
        const rows = Object.values(tableData).reduce(
            (acc, v) => ({...acc, ...v[0]}),
            {}
        );
        return (
            <Table
                columns={[
                    {title: "", dataIndex: "col", key: "col"},
                    ...Object.keys(rows).map((r, i) => ({
                        title: r.split("_").join(" "),
                        dataIndex: `col${i}`,
                        key: `col${i}`,
                    })),
                ]}
                dataSource={[
                    ...Object.keys(tableData).map((k, i) => ({
                        key: `row${i}`,
                        col: k,
                        ...Object.keys(rows).reduce(
                            (acc, cur, i) => ({
                                ...acc,
                                [`col${i}`]: tableData[k][0][cur] || "-",
                            }),
                            {}
                        ),
                    })),
                ]}
            />
        );
    };

    const renderSummary = (data) => (
        <Modal
            visible={true}
            onCancel={() => setSummaryShown(false)}
            width={width - 90}
            footer={null}
        >
            {data ? (
                <div className="content">
                    A Reference Databases:{" "}
                    <a href={data["A Reference Databases"]}>
                        {data["A Reference Databases"]}
                    </a>
                    <Tabs
                        tabBarExtraContent={
                            summary && (
                                <Button
                                    icon={<DownloadOutlined/>}
                                    onClick={() => {
                                        let json = JSON.stringify(summary);
                                        const link = document.createElement("a");
                                        let file = new Blob([json], {type: "text/json"});
                                        link.href = URL.createObjectURL(file);
                                        link.download = `summary.json`;
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    }}
                                >
                                    Download summary JSON
                                </Button>
                            )
                        }
                    >
                        {Object.keys(data)
                            .filter((d, i) => i)
                            .map((d, i) => (
                                <Tabs.TabPane key={`k${i}`} tab={d} id={`tab${i}`}>
                                    {renderSummaryTable(Object.values(data)[i + 1])}
                                </Tabs.TabPane>
                            ))}
                    </Tabs>
                </div>
            ) : (
                <Fragment>
                    <Spin style={{marginRight: 15}}/> Fetching summary ...
                </Fragment>
            )}
        </Modal>
    );

    return (
        <div className="content-wrapper">
            {/* Logo and title */}
            <div className="landing-page container">
                <Header/>
                {/* {response && response.status === COMPLETED && renderComplete()}
        {response && response.status === ACTIVE && renderActive()}
        {response && response.status === ERROR && renderError()} */}
                {/* Show loader if there is a request being processed */}

                {renderComplete()}
            </div>
            {/* Show annotations tables */}
            {isTableShown && (
                <TabbedTables
                    tables={response.csv_files}
                    fetchTableData={fetchTableData}
                    handleClose={() => setTableShown(false)}
                    id={id}
                />
            )}
            {isSummaryShown && renderSummary(summary)}
        </div>
    );
}

export default AnnotationResult;
