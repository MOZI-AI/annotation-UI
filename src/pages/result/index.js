import React, { useState, useEffect, Fragment } from "react";
import { HashRouter as Router, Route, Link, Redirect } from "react-router-dom";
import {
  Button,
  Alert,
  Spin,
  Typography,
  Icon,
  Tabs,
  Modal,
  Table,
} from "antd";
import { parse, distanceInWordsToNow } from "date-fns";
import { RESULT_ADDR, downloadSchemeFile } from "../../service";
import TabbedTables from "../../components/result-tables";
import Visualizer from "../../components/visualizer";
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
  const [isFetchingResult, setFetchingResult] = useState(false);
  const [summary, setSummary] = useState(undefined);
  const [isSummaryShown, setSummaryShown] = useState(false);
  // const { ACTIVE, COMPLETED, ERROR } = AnnotationStatus;
  const id = props.match.params.id;

  useEffect(() => {
    if (id) {
      setFetchingResult(true);
      fetch(`${RESULT_ADDR}/${id}`)
        .then((res) => res.json())
        .then((result) => {
          setFetchingResult(false);
          setResponse({ result });
        });
    }
  }, []);

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
    const { nodes, edges } = response.result.elements;
    return (
      <Fragment>
        <p>
          The result contains {nodes.length} entities and {edges.length}{" "}
          connections between them.
          <br />
          This page will expire in{" "}
          {distanceInWordsToNow(parse(response.expire_time * 1000))}.
        </p>
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

          <Button onClick={(e) => setTableShown(true)}>
            View results table
          </Button>
          <Button onClick={() => downloadSchemeFile(props.match.params.id)}>
            Download Scheme File
          </Button>
          <Button type="primary">
            <Link to={`/result/${props.match.params.id}/visualizer`}>
              Visualize the result
            </Link>
          </Button>
        </div>
        <Typography.Paragraph className="call-to-action">
          <Link to="/">
            <Icon type="arrow-left" />
            Run another annotation
          </Link>
        </Typography.Paragraph>
      </Fragment>
    );
  };

  const renderSummaryTable = (tableData) => {
    const rows = Object.values(tableData).reduce(
      (acc, v) => ({ ...acc, ...v[0] }),
      {}
    );
    return (
      <Table
        columns={[
          { title: "", dataIndex: "col", key: "col" },
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
                  icon="download"
                  onClick={() => {
                    let json = JSON.stringify(summary);
                    const link = document.createElement("a");
                    let file = new Blob([json], { type: "text/json" });
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
          <Spin style={{ marginRight: 15 }} /> Fetching summary ...
        </Fragment>
      )}
    </Modal>
  );

  return (
    <div className="content-wrapper">
      {/* Logo and title */}
      <div className="landing-page container">
        <Header />
        {/* {response && response.status === COMPLETED && renderComplete()}
        {response && response.status === ACTIVE && renderActive()}
        {response && response.status === ERROR && renderError()} */}
        {/* Show loader if there is a request being processed */}
        {isFetchingResult && (
          <div className="spin-wrapper">
            <Spin /> Fetching results ...
          </div>
        )}
        {!isFetchingResult && response && renderComplete()}
      </div>
      {/* Show the visualizer */}
      <Router>
        <Route
          path="/result/:id/visualizer"
          exact
          render={() =>
            response && response.result ? (
              <Visualizer
                graph={{ ...response.result.elements }}
                annotations={response.result.elements.nodes
                  .reduce(
                    (acc, n) => [...acc, ...n.data.group, n.data.subgroup],
                    []
                  )
                  .filter((a, i, self) => a && self.indexOf(a) === i)}
              />
            ) : (
              <Redirect to={`/result/${id}`} />
            )
          }
        />
      </Router>
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
