import React, { useState, useCallback } from "react";
import {
  Typography,
  Tabs,
  Input,
  Upload,
  Checkbox,
  Select,
  Switch,
  InputNumber,
  Tag,
  Button,
  Row,
  Col,
  message,
  notification,
  Alert,
} from "antd";
import {CheckOutlined, InboxOutlined} from "@ant-design/icons"
import Header from "../../components/header";
import { Annotate } from "../../proto/annotation_pb_service";
import { grpc } from "grpc-web-client";
import {
  AnnotationRequest,
  Annotation,
  Gene,
  Filter,
} from "../../proto/annotation_pb";
import { GRPC_ADDR, capitalizeFirstLetter } from "../../service";
import "./style.css";

const {Option} = Select;
const GeneGoOptions = [
  { label: "Biological Process", value: "biological_process" },
  { label: "Cellular Component", value: "cellular_component" },
  { label: "Molecular Function", value: "molecular_function" },
];

const Pathways = [
  { label: "SMPDB", value: "smpdb" },
  {
    label: (
      <a href="http://www.reactome.org" target="_blank">
        Reactome
      </a>
    ),
    value: "reactome",
  },
];

const GeneInputMethods = { Manual: "manual", Import: "import" };
const virusGenes = [
  "NSP1",
  "NSP7",
  "ORF8",
  "NSP10",
  "E",
  "N",
  "M",
  "NSP6",
  "ORF6",
  "ORF7A",
  "ORF9C",
  "NSP4",
  "NSP8",
  "NSP9",
  "ORF10",
  "NSP14",
  "S",
  "ORF3A",
  "NSP13",
  "ORF3B",
  "NSP5",
  "NSP12",
  "NSP2",
  "ORF9B",
  "NSP11",
  "NSP15",
];
const stringInters = ["binding", "reaction", "inhibition",
      "activation", "expression", "catalysis", "ptmod"]
function AnnotationForm(props) {
  const geneInputRef = React.createRef();
  const [genes, setGenes] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [geneGOParents, setParents] = useState(0);
  const [goParents, setGOParents] = useState(1)
  const [pathways, setPathways] = useState(["reactome"]);
  const [includeSmallMolecules, setIncludeSmallMolecules] = useState(false);
  const [geneLevel, setGeneLevel] = useState(false);
  const [includeCov, setIncludeCov] = useState(true);

  const [annotatePathwayWithString, setAnnotatePathwayWithString] = useState(
    false
  );
  const [loading, setLoading] = useState(false);
  const [GOSubgroups, setGOSubgroups] = useState([
    "biological_process",
    "cellular_component",
    "molecular_function",
  ]);
  const [stringInteractions, setStringInteractions] = useState(["binding", "reaction"])
  const [geneInputMethod, setGeneInputMethod] = useState(
    GeneInputMethods.Manual
  );
  const [includeCodingRNA, setIncludeCodingRNA] = useState(false);
  const [includeNoncodingRNA, setIncludeNoncodingRNA] = useState(false);

  const addGene = useCallback(
    (e) => {
      setGenes((gns) => {
        const gene = e.trim().toUpperCase().split(" ");
        if (gene.some((g) => gns.includes(g))) {
          message.warn("Gene already exists!");
          return gns;
        } else {
          return [...gns, ...gene];
        }
      });
      geneInputRef.current.setValue("");
    },
    [genes]
  );

  const toggleAnnotation = (annotation, e) => {
    if(annotation === "biogrid-interaction-annotation" && !geneLevel && e.target.checked){
      message.error("Genes only must be on before selecting BioGRID");
      e.target.checked = false;
    } else {
      const updated = e.target.checked
      ? [...annotations, annotation]
      : annotations.filter((a) => a !== annotation);
     setAnnotations(updated);
    }
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setGenes(reader.result.split("\n"));
      message.success("Genes imported!");
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    setLoading(true);
    const annotationRequest = new AnnotationRequest();
    annotationRequest.setGenesList(
      genes.map((g) => {
        const gene = new Gene();
        gene.setGenename(g);
        return gene;
      })
    );
    // Namespaces and number of parents filters
    const namespace = new Filter();
    namespace.setFilter("namespace");
    namespace.setValue(GOSubgroups.join(" "));
    const nop = new Filter();
    nop.setFilter("parents");
    nop.setValue(geneGOParents.toString());
     const gl = new Filter();
    gl.setFilter("gene-level?");
    gl.setValue(capitalizeFirstLetter(geneLevel.toString()));
    const annList = annotations.map((sa) => {
      const annotation = new Annotation();
      annotation.setFunctionname(sa);
      if (sa === "gene-go-annotation") {
        const ip = new Filter();
        annotation.setFiltersList([namespace, nop, gl]);
      } else if (sa === "gene-pathway-annotation") {
        const ps = new Filter();
        ps.setFilter("pathway");
        ps.setValue(pathways.join(" "));
        const ism = new Filter();
        ism.setFilter("include_sm");
        ism.setValue(capitalizeFirstLetter(includeSmallMolecules.toString()));
        const capb = new Filter();
        capb.setFilter("string?");
        capb.setValue(capitalizeFirstLetter(annotatePathwayWithString.toString()));
        const coding = new Filter();
        coding.setFilter("coding");
        coding.setValue(capitalizeFirstLetter(includeCodingRNA.toString()));
        const noncoding = new Filter();
        noncoding.setFilter("noncoding");
        noncoding.setValue(
          capitalizeFirstLetter(includeNoncodingRNA.toString())
        );
        annotation.setFiltersList([ps, gl, ism, capb, coding, noncoding]);
      } else if(sa === "string-interaction-annotation"){
        const str = new Filter()
        str.setFilter("interactions")
        str.setValue(stringInteractions.length > 0 ? stringInteractions.join(" ") : "False");
        const coding = new Filter();
        coding.setFilter("coding");
        coding.setValue(capitalizeFirstLetter(includeCodingRNA.toString()));
        const noncoding = new Filter();
        noncoding.setFilter("noncoding");
        noncoding.setValue(
          capitalizeFirstLetter(includeNoncodingRNA.toString())
        );
        annotation.setFiltersList([str, gl, coding, noncoding]);
      } else if (sa === "biogrid-interaction-annotation") {
        const cov = new Filter();
        cov.setFilter("exclude-orgs");
        cov.setValue(includeCov ? "" : "2697049");

        const coding = new Filter();
        coding.setFilter("coding");
        coding.setValue(capitalizeFirstLetter(includeCodingRNA.toString()));
        const noncoding = new Filter();
        noncoding.setFilter("noncoding");
        noncoding.setValue(
          capitalizeFirstLetter(includeNoncodingRNA.toString())
        );
        annotation.setFiltersList([coding, noncoding, cov]);
      } else if (sa === "go-annotation"){
          const pars = new Filter();
          pars.setFilter("parents");
          pars.setValue(goParents.toString());
          annotation.setFiltersList([pars]);
      }
      return annotation;
    });
    const includeRNA = new Annotation();
    includeRNA.setFunctionname("include-rna");
    const coding = new Filter();
    coding.setFilter("coding");
    coding.setValue(capitalizeFirstLetter(includeCodingRNA.toString()));
    const noncoding = new Filter();
    noncoding.setFilter("noncoding");
    noncoding.setValue(capitalizeFirstLetter(includeNoncodingRNA.toString()));
    const protein = new Filter();
    includeRNA.setFiltersList([gl, coding, noncoding]);
    annotationRequest.setAnnotationsList(
      includeCodingRNA || includeNoncodingRNA
        ? [...annList, includeRNA]
        : annList
    );

    grpc.unary(Annotate.Annotate, {
      request: annotationRequest,
      host: GRPC_ADDR,
      onEnd: ({ status, statusMessage, message: msg }) => {
        setLoading(false);
        if (status === grpc.Code.OK) {
          props.history.push({
            pathname: `/result/${msg.array[0].substr(
              msg.array[0].indexOf("id=") + 3
            )}`,
          });
        } else {
          let error;
          try {
            error = JSON.parse(statusMessage);
          } catch (err) {
            error = statusMessage;
          }

          if (Array.isArray(error)) {
            const invalidGenes = error.map((g) => g.symbol);
            setGenes((gns) => gns.filter((g) => !invalidGenes.includes(g)));
            notification.warning({
              message: (
                <Typography.Title level={4}>Gene not found</Typography.Title>
              ),
              description: (
                <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                  {error
                    .filter((e) => e.current !== "")
                    .map((g) => (
                      <p key={g.symbol}>
                        Symbol for gene <Tag color="red">{g.symbol}</Tag> has
                        changed to{" "}
                        <Tag color="green" onClick={() => addGene(g.current)}>
                          {g.current}
                        </Tag>
                      </p>
                    ))}
                  {error
                    .filter((e) => e.similar.length)
                    .map((e) => (
                      <p key={e.symbol}>
                        <Tag color="red">{e.symbol}</Tag> was not found in the
                        atomspace. Did you mean{" "}
                        {e.similar.map((s) => (
                          <Tag
                            key={s}
                            color="green"
                            onClick={() => addGene(s)}
                            // style={{ fontSize: "1.1rem" }}
                          >
                            {s}
                          </Tag>
                        ))}
                        ?
                      </p>
                    ))}
                  {error
                    .filter((e) => !e.current && !e.similar.length)
                    .map((g) => (
                      <p key={g}>
                        <Tag color="red">{g.symbol}</Tag> does not exist in the
                        atomespace
                      </p>
                    ))}
                </div>
              ),
              duration: 0,
              placement: "bottomRight",
            });
          } else {
            notification.error({
              message: "An error occurred",
              description: statusMessage,
              duration: 10,
              placement: "bottomRight",
            });
          }
        }
      },
    });
  };

  return (
    <div className="container form-wrapper">
      <Header />
      <Row>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 20, offset: 2 }}
          md={{ span: 10, offset: 7 }}
        >
          {/* Gene List */}
          <span className="title">
            Input{" "}
            <a href="http://www.genenames.org" target="_blank">
              HGNC
            </a>{" "}
            Gene Symbols
          </span>
          <Tabs activeKey={geneInputMethod} onChange={setGeneInputMethod}>
            <Tabs.TabPane tab="Input directly" key={GeneInputMethods.Manual}>
              <Input
                ref={geneInputRef}
                size="large"
                placeholder={
                  genes.length
                    ? "SARS-CoV-2 genes and proteins are now supported"
                    : "Enter Gene, GO category or Protein name and hit enter"
                }
                onPressEnter={(e) => addGene(e.target.value)}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Import from file" key={GeneInputMethods.Import}>
              <Upload.Dragger
                multiple={false}
                beforeUpload={(file) => {
                  handleFileUpload(file);
                  return false;
                }}
                previewFile={(file) => null}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to import gene list
                </p>
                <p className="ant-upload-hint">
                  The file must be a plain text file with one gene name per line
                </p>
              </Upload.Dragger>
            </Tabs.TabPane>
          </Tabs>
          <div className="gene-list">
            {genes.map((g) => (
              <Tag
                closable
                color={virusGenes.includes(g) ? "purple" : "blue"}
                key={g}
                onClose={() => {
                  setGenes(genes.filter((f) => f !== g));
                }}
              >
                {g}
              </Tag>
            ))}
            {genes.length > 1 && (
              <Button
                icon="delete"
                type="danger"
                size="small"
                ghost
                onClick={(e) => setGenes([])}
              />
            )}
          </div>
          {/* Annotations */}
          {/*Gene/Protein annotations */}
          <span className="title">Gene/Protein Annotations</span>
          <ul className="annotation-list">
            <li>
              <Checkbox
                onChange={(e) => toggleAnnotation("gene-go-annotation", e)}
              >
                <a href="http://www.geneontology.org" target="_blank">
                  Gene Ontology
                </a>
              </Checkbox>
              {annotations.includes("gene-go-annotation") && (
                <div className="annotation-parameters">
                  <div className="parameter">
                    <Checkbox.Group
                      defaultValue={GOSubgroups}
                      options={GeneGoOptions}
                      onChange={setGOSubgroups}
                    />
                  </div>
                  <div className="parameter">
                    <Typography.Text>
                      <div className="label">Number of parents: </div>
                    </Typography.Text>
                    <InputNumber
                      defaultValue={geneGOParents}
                      min={1}
                      onChange={setParents}
                    />
                  </div>
                </div>
              )}
            </li>
            <li>
              <Checkbox
                onChange={(e) => toggleAnnotation("gene-pathway-annotation", e)}
              >
                Curated Pathways
              </Checkbox>
              {annotations.includes("gene-pathway-annotation") && (
                <div className="annotation-parameters">
                  <div className="parameter">
                    <Checkbox.Group
                      options={Pathways}
                      defaultValue={pathways}
                      onChange={setPathways}
                    />
                  </div>
                  <div className="parameter">
                    <Switch
                      defaultChecked={includeSmallMolecules}
                      onChange={setIncludeSmallMolecules}
                    />
                    {"  "}
                    <div className="label">Small Molecules</div>
                  </div>
                  <div className="parameter">
                    <Switch
                      defaultChecked={annotatePathwayWithString}
                      onChange={setAnnotatePathwayWithString}
                    />
                    {"  "}
                    <div className="label">Cross annotate with STRING</div>
                  </div>
                </div>
              )}
            </li>
            <li>
              <Checkbox
                  onChange={(e) => toggleAnnotation("string-interaction-annotation", e)}>
                <a href="https://string-db.org/" target="_blank">
                  STRING Protein Interaction
                </a>
              </Checkbox>
                {annotations.includes("string-interaction-annotation") && (
                    <div className="annotation-parameters">
                      <div className="label">Interaction types:</div>
                      <div className="parameter">
                        <Select mode="multiple" style={{width : '100%'}} defaultValue={stringInteractions} placeholder="interactions" onChange={setStringInteractions}>
                          {stringInters.map((inter, index) => {
                            return <Option key={inter}>{inter}</Option>
                          })}
                        </Select>
                      </div>
                    </div>
                )}
            </li>
            <li>
              <Checkbox
                onChange={(e) =>
                  toggleAnnotation("biogrid-interaction-annotation", e)
                }
              >
                Biogrid Gene Interaction
              </Checkbox>
            </li>
          </ul>

          {/*Other Annotations*/}
          <span className="title">Other Annotations</span>
          <ul className="annotation-list">
            <li>
              <Checkbox
                onChange={(e) => toggleAnnotation("go-annotation", e)}>
                <a href="http://www.geneontology.org" target="_blank">
                  GO
                </a>
              </Checkbox>
              {annotations.includes("go-annotation") && (
                <div className="annotation-parameters">
                  <div className="parameter">
                    <Typography.Text>
                      <div className="label">Number of parents: </div>
                    </Typography.Text>
                    <InputNumber
                      defaultValue={goParents}
                      min={1}
                      onChange={setGOParents}
                    />
                  </div>
                </div>
              )}
            </li>
          </ul>

          <span className="title" style={{ marginTop: 30 }}>
            Include RNA
          </span>
          <div style={{ display: "flex" }}>
            <div className="parameter">
              <Switch
                defaultChecked={includeCodingRNA}
                onChange={setIncludeCodingRNA}
              />
              <div className="label" style={{ marginLeft: 5 }}>
                Coding RNA
              </div>
            </div>

            <div className="parameter">
              <Switch
                defaultChecked={includeNoncodingRNA}
                onChange={setIncludeNoncodingRNA}
              />
              <div className="label" style={{ marginLeft: 5 }}>
                Non-coding RNA
              </div>
            </div>
          </div>

          <span className="title" style={{ marginTop: 30 }}>
          </span>
          <div className="parameter">
            <Switch
              defaultChecked={geneLevel}
              onChange={setGeneLevel}
            />
            {"  "}
            <div className="label">Gene Only</div>
          </div>

          <span className="title" style={{ marginTop: 30 }}>
            SARS-CoV-2
          </span>
          <div className="parameter">
            <Switch defaultChecked={includeCov} onChange={setIncludeCov} />
            {"  "}
            <div className="label">Include SARS-CoV-2</div>
          </div>

          {annotatePathwayWithString && (
            <Alert
              type="warning"
              message="Cross annotation will increase the size"
              description="If the result is too large, you might have difficulties visualizing it."
              showIcon
            ></Alert>
          )}
          <div className="actions">
            <Button
              type="primary"
              icon={<CheckOutlined/>}
              disabled={!annotations.length || !genes.length}
              onClick={handleSubmit}
              loading={loading}
            >
              {loading ? "Processing annotation request ..." : "Submit"}
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
}

import { withRouter } from "react-router-dom";
export default withRouter(AnnotationForm);
