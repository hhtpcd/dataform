import { dataform } from "@dataform/protos";
import * as adapters from "./adapters";
import { AContextable, Assertion } from "./assertion";
import { OContextable, Operation } from "./operation";
import { Table, TConfig, TContextable } from "./table";
import * as utils from "./utils";

interface ActionProto {
  name?: string;
  fileName?: string;
  dependencies?: string[];
}

export class Session {
  public rootDir: string;

  public config: dataform.IProjectConfig;

  public tables: { [name: string]: Table };
  public operations: { [name: string]: Operation };
  public assertions: { [name: string]: Assertion };

  public graphErrors: dataform.IGraphErrors;

  constructor(rootDir: string, projectConfig?: dataform.IProjectConfig) {
    this.init(rootDir, projectConfig);
  }

  public init(rootDir: string, projectConfig?: dataform.IProjectConfig) {
    this.rootDir = rootDir;
    this.config = projectConfig || {
      defaultSchema: "dataform",
      assertionSchema: "dataform_assertions"
    };
    this.tables = {};
    this.operations = {};
    this.assertions = {};
    this.graphErrors = { compilationErrors: [] };
  }

  public adapter(): adapters.IAdapter {
    return adapters.create(this.config);
  }

  public target(target: string, defaultSchema?: string): dataform.ITarget {
    const suffix = !!this.config.schemaSuffix
      ? `_${this.config.schemaSuffix}`
      : "";

    if (target.includes(".")) {
      const schema = target.split(".")[0];
      const name = target.split(".")[1];
      return dataform.Target.create({ name, schema: schema + suffix });
    } else {
      return dataform.Target.create({
        name: target,
        schema: (defaultSchema || this.config.defaultSchema) + suffix
      });
    }
  }

  public ref(name: string): string {
    const tNode = this.tables[name];
    const oNode = this.operations[name];

    if (tNode) {
      if (tNode.proto.type === "inline") {
        return `(${tNode.proto.query})`;
      }
      return this.adapter().resolveTarget((tNode as Table).proto.target);
    } else if (oNode && oNode.proto.hasOutput) {
      return this.adapter().resolveTarget((oNode as Operation).proto.target);
    } else {
      const message = `Could not find referenced node: ${name}`;
      this.compileError(new Error(message));
    }
  }

  public operate(name: string, queries?: OContextable<string | string[]>): Operation {
    const operation = new Operation();
    operation.session = this;
    operation.proto.name = name;
    operation.proto.target = this.target(name);
    if (queries) {
      operation.queries(queries);
    }
    operation.proto.fileName = utils.getCallerFile(this.rootDir);
    // Add it to global index.
    this.operations[name] = operation;
    return operation;
  }

  public materialize(name: string, queryOrConfig?: TContextable<string> | TConfig): Table {
    return this.publish(name, queryOrConfig);
  }

  public publish(name: string, queryOrConfig?: TContextable<string> | TConfig): Table {
    // Check for duplicate names
    if (this.tables[name]) {
      const message = `Duplicate node name detected, names must be unique across tables, assertions, and operations: "${name}"`;
      this.compileError(new Error(message));
    }

    const table = new Table();
    table.session = this;
    table.proto.name = name;
    table.proto.target = this.target(name);
    if (!!queryOrConfig) {
      if (typeof queryOrConfig === "object") {
        table.config(queryOrConfig);
      } else {
        table.query(queryOrConfig);
      }
    }
    table.proto.fileName = utils.getCallerFile(this.rootDir);
    // Add it to global index.
    this.tables[name] = table;
    return table;
  }

  public assert(name: string, query?: AContextable<string>): Assertion {
    const assertion = new Assertion();
    assertion.session = this;
    assertion.proto.name = name;
    assertion.proto.target = this.target(name, this.config.assertionSchema);
    if (query) {
      assertion.query(query);
    }
    assertion.proto.fileName = utils.getCallerFile(this.rootDir);
    // Add it to global index.
    this.assertions[name] = assertion;
    return assertion;
  }

  public compileError(err: Error, path?: string) {
    const fileName = path || utils.getCallerFile(this.rootDir) || __filename;

    const compileError = dataform.CompilationError.create({
      stack: err.stack,
      fileName,
      message: err.message
    });
    this.graphErrors.compilationErrors.push(compileError);
  }

  public compileGraphChunk<T>(part: { [name: string]: { proto: ActionProto; compile(): T } }): T[] {
    const compiledChunks: T[] = [];

    Object.keys(part).forEach(key => {
      try {
        const compiledChunk = part[key].compile();
        compiledChunks.push(compiledChunk);
      } catch (e) {
        this.compileError(e, part[key].proto.fileName);
      }
    });

    return compiledChunks;
  }

  public compile(): dataform.ICompiledGraph {
    const compiledGraph = dataform.CompiledGraph.create({
      projectConfig: this.config,
      tables: this.compileGraphChunk(this.tables),
      operations: this.compileGraphChunk(this.operations),
      assertions: this.compileGraphChunk(this.assertions),
      graphErrors: this.graphErrors
    });

    return compiledGraph;
  }
}
