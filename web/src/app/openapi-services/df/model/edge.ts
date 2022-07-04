/**
 * Directory Facilitator
 * API of the DF
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


/**
 * one edge of graph
 */
export interface Edge { 
    /**
     * id of node 1
     */
    n1: number;
    /**
     * id of node 2
     */
    n2: number;
    /**
     * weight of edge
     */
    weight: number;
}
