# grpc-node-course

To get started, make sure to install the NPM dependencies:

`$ npm install`

protoc -I=. ./protos/dummy.proto
--js_out=import_style=commonjs,binary:./server
--grpc_out=./server
--plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin`
