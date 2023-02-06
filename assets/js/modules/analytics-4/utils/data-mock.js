/**
 * Analytics 4 test data mock.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import md5 from 'md5';
import faker from 'faker';
import invariant from 'invariant';
import castArray from 'lodash/castArray';
import { Observable, merge, from } from 'rxjs';
import { map, reduce, take, toArray, mergeMap } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';
import isPlainObject from 'lodash/isPlainObject';

/**
 * Internal dependencies
 */
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import { isValidDateString } from '../../../util';
import { stringToDate } from '../../../util/date-range/string-to-date';

const ANALYTICS_4_METRIC_TYPES = {
	totalUsers: 'TYPE_INTEGER',
	newUsers: 'TYPE_INTEGER',
	sessions: 'TYPE_INTEGER',
	conversions: 'TYPE_INTEGER',
	screenPageViews: 'TYPE_INTEGER',
	engagedSessions: 'TYPE_INTEGER',
	averageSessionDuration: 'TYPE_SECONDS',
};

const ANALYTICS_4_DIMENSION_OPTIONS = {
	sessionDefaultChannelGrouping: [
		'Direct',
		'Organic Search',
		'Paid Social',
		'Organic Social',
		'Email',
		'Affiliates',
		'Referral',
		'Paid Search',
		'Video',
		'Display',
	],
	country: [
		'United States',
		'United Kingdom',
		'India',
		'(not set)',
		'France',
		'Ukraine',
		'Italy',
		'Mexico',
	],
	deviceCategory: [ 'Desktop', 'Tablet', 'Mobile' ],
	pageTitle: ( i ) => ( i <= 12 ? `Test Post ${ i }` : false ),
	pagePath: ( i ) => ( i <= 12 ? `/test-post-${ i }/` : false ),
};

/**
 * Gets metric key.
 *
 * @since n.e.x.t
 *
 * @param {string|Object} metric Metric name or object.
 * @return {string} Metric key.
 */
function getMetricKey( metric ) {
	return metric?.name || metric.toString();
}

/**
 * Gets metric type.
 *
 * @since n.e.x.t
 *
 * @param {string|Object} metric Metric name or object.
 * @return {string} Type of the metric.
 */
function getMetricType( metric ) {
	return ANALYTICS_4_METRIC_TYPES[ getMetricKey( metric ) ];
}

/**
 * Generates and returns metric values.
 *
 * @since n.e.x.t
 *
 * @param {Array.<Object>} validMetrics Metric list.
 * @return {Array.<Object>} Array of metric values.
 */
function generateMetricValues( validMetrics ) {
	const values = [];

	validMetrics.forEach( ( validMetric ) => {
		switch ( getMetricType( validMetric ) ) {
			case 'TYPE_INTEGER':
				values.push( {
					value: faker.datatype
						.number( { min: 0, max: 100 } )
						.toString(),
				} );
				break;
			case 'TYPE_SECONDS':
				values.push( {
					value: faker.datatype
						.number( { min: 0, max: 60 } )
						.toString(),
				} );
				break;
		}
	} );

	return values;
}

/**
 * Generates the cartesian product of a set of arrays, i.e. all possible combinations of their values.
 *
 * Cribbed from https://stackoverflow.com/a/36234242/12296658, thanks to the original author(s).
 *
 * @since n.e.x.t
 *
 * @param {Array.<Array>} arrays An array of arrays.
 * @return {Array.<Array>} The cartesian product of the input arrays.
 */
function cartesianProduct( arrays ) {
	return arrays.reduce(
		function ( arrayA, arrayB ) {
			return arrayA
				.map( function ( valueA ) {
					return arrayB.map( function ( valueB ) {
						return valueA.concat( [ valueB ] );
					} );
				} )
				.reduce( function ( innerA, innerB ) {
					return innerA.concat( innerB );
				}, [] );
		},
		[ [] ]
	);
}

/**
 * Sorts report rows and returns it.
 *
 * @since n.e.x.t
 *
 * @param {Array.<Object>}        rows    Array of rows to sort.
 * @param {Array.<Object>}        metrics Array of report metrics.
 * @param {Object|Array.<Object>} orderby Sorting options.
 * @return {Array.<Object>} Sorted rows.
 */
function sortRows( rows, metrics, orderby ) {
	let sorted = rows;

	const orders = castArray( orderby );
	for ( const order of orders ) {
		const direction = order?.sortOrder === 'DESCENDING' ? -1 : 1;
		const index = metrics.findIndex(
			( metric ) => getMetricKey( metric ) === order?.fieldName
		);
		if ( index < 0 ) {
			continue;
		}

		sorted = sorted.sort( ( a, b ) => {
			let valA = parseFloat( a.metricValues[ index ]?.value );
			if ( Number.isNaN( valA ) ) {
				valA = 0;
			}

			let valB = parseFloat( b.metricValues[ index ]?.value );
			if ( Number.isNaN( valB ) ) {
				valB = 0;
			}

			return ( valA - valB ) * direction;
		} );
	}

	return sorted;
}

/**
 * Generates date range.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate The start date.
 * @param {string} endDate   The end date.
 * @return {Array.<string>} An array with dates.
 */
function generateDateRange( startDate, endDate ) {
	const dates = [];

	const currentDate = stringToDate( startDate );
	const end = stringToDate( endDate );

	while ( currentDate.getTime() <= end.getTime() ) {
		// Ensure the generated dates are the same regardless of local timezone.
		const year = currentDate.getFullYear();
		const month = String( currentDate.getMonth() + 1 ).padStart( 2, '0' );
		const day = String( currentDate.getDate() ).padStart( 2, '0' );

		dates.push( `${ year }${ month }${ day }` );

		currentDate.setDate( currentDate.getDate() + 1 );
	}

	return dates;
}

/**
 * Returns the earliest of two dates.
 *
 * @since n.e.x.t
 *
 * @param {string} dateA The first date.
 * @param {string} dateB The second date.
 * @return {string} The earliest date.
 */
function getEarliestDate( dateA, dateB ) {
	if ( ! dateB ) {
		return dateA;
	}

	return stringToDate( dateA ).getTime() < stringToDate( dateB ).getTime()
		? dateA
		: dateB;
}

/**
 * Returns the latest of two dates.
 *
 * @since n.e.x.t
 *
 * @param {string} dateA The first date.
 * @param {string} dateB The second date.
 * @return {string} The latest date.
 */
function getLatestDate( dateA, dateB ) {
	if ( ! dateB ) {
		return dateA;
	}

	return stringToDate( dateA ).getTime() > stringToDate( dateB ).getTime()
		? dateA
		: dateB;
}

/**
 * Generates mock data for Analytics 4 reports.
 *
 * @since n.e.x.t
 *
 * @param {Object} options Report options.
 * @return {Array.<Object>} An array with generated report.
 */
export function getAnalytics4MockResponse( options ) {
	invariant(
		isPlainObject( options ),
		'report options are required to generate a mock response.'
	);
	invariant(
		isValidDateString( options.startDate ),
		'a valid startDate is required.'
	);
	invariant(
		isValidDateString( options.endDate ),
		'a valid endDate is required.'
	);

	// Ensure we don't mutate the passed options to avoid unexpected side effects for the caller.
	const args = cloneDeep( options );

	const originalSeedValue = faker.seedValue;
	const argsHash = parseInt(
		md5( args.url || 'http://example.com' ).substring( 0, 8 ),
		16
	);

	// We set seed for every data mock to make sure that the same arguments get the same report data.
	// It means that everyone will have the same report data and will see the same widgets in the storybook.
	// This approach gives us additional flexibility to control randomness on a per widget basis.
	if ( ! Number.isNaN( argsHash ) ) {
		faker.seed( argsHash );
	}

	const data = {
		rowCount: 0,
		rows: [],
		totals: [],
		minimums: [],
		maximums: [],
		metadata: {
			currencyCode: 'USD',
			timeZone: 'America/Los_Angeles',
		},
		kind: 'analyticsData#runReport',
	};

	const { compareStartDate, compareEndDate } = args;
	const hasDateRange = compareStartDate && compareEndDate;

	const validMetrics = ( args.metrics || [] ).filter(
		( metric ) => !! getMetricType( metric )
	);
	const streams = [];

	// Generate streams (array) of dimension values. Each dimension will have its own stream (array) of data.
	// Then streams will be merged into one (see zip( ... ) function call) and metric values will be added to each
	// dimension set in the combined stream (array). We need to use array of streams because report arguments may
	// have 0 or N dimensions (N > 1) which means that in the each row of the report data we will have an array
	// of dimension values.
	const dimensions = castArray( args.dimensions );

	if ( hasDateRange ) {
		dimensions.push( 'dateRange' );
	}

	dimensions.forEach( ( singleDimension ) => {
		const dimension = singleDimension?.name || singleDimension?.toString();

		if ( dimension === 'date' || dimension === 'dateRange' ) {
			// When a comparison date range is specified, the report will contain a merged date range of the current and compare periods.
			const startDate = getEarliestDate(
				args.startDate,
				args.compareStartDate
			);
			const endDate = getLatestDate( args.endDate, args.compareEndDate );

			const dateRange = generateDateRange( startDate, endDate );

			// Generates a stream (an array) of dates when the dimension is date.
			if ( dimension === 'date' ) {
				streams.push( from( dateRange ) );
			}

			if ( dimension === 'dateRange' ) {
				streams.push( from( [ 'date_range_0', 'date_range_1' ] ) );
			}
		} else if (
			dimension &&
			typeof ANALYTICS_4_DIMENSION_OPTIONS[ dimension ] === 'function'
		) {
			// Generates a stream (an array) of dimension values using a function associated with the current dimension.
			streams.push(
				new Observable( ( observer ) => {
					for ( let i = 1; i <= 90; i++ ) {
						// 90 is the max number of dates in the longest date range.
						const val =
							ANALYTICS_4_DIMENSION_OPTIONS[ dimension ]( i );
						if ( val ) {
							observer.next( val );
						} else {
							break;
						}
					}

					observer.complete();
				} )
			);
		} else if (
			dimension &&
			Array.isArray( ANALYTICS_4_DIMENSION_OPTIONS[ dimension ] )
		) {
			// Uses predefined array of dimension values to create a stream (an array) from.
			streams.push( from( ANALYTICS_4_DIMENSION_OPTIONS[ dimension ] ) );
		} else {
			// In case when a dimension is not provided or is not recognized, we use NULL to create a stream (an array) with just one value.
			streams.push( from( [ null ] ) );
		}
	} );

	const limit = args.limit > 0 ? +args.limit : 90;
	// If we have a date range, we need to double the limit to account for the fact that we duplicate each row for each date range.
	const rowLimit = hasDateRange ? limit * 2 : limit;

	// This is the list of operations that we apply to the combined stream (array) of dimension values.
	const ops = [
		// Convert a dimension value to a row object and generate metric values.
		map( ( dimensionValue ) => ( {
			dimensionValues: castArray( dimensionValue ).map( ( value ) => ( {
				value,
			} ) ),
			metricValues: generateMetricValues( validMetrics ),
		} ) ),
		// Make sure we take the appropriate number of rows.
		take( rowLimit ),
		// Accumulate all rows into a single array.
		reduce( ( rows, row ) => [ ...rows, row ], [] ),
		// Sort rows if args.orderby is provided.
		map( ( rows ) =>
			args.orderby ? sortRows( rows, validMetrics, args.orderby ) : rows
		),
	];

	// Process the streams of dimension values and add generated rows to the report data object.
	// First we merge all streams into one which will emit each set of dimension values as an array.
	merge( ...streams.map( ( stream ) => stream.pipe( toArray() ) ) )
		.pipe(
			// Then we convert the resulting stream to an array...
			toArray(),
			// So that we can pass it to the cartesianProduct function to generate all possible combinations of dimension values.
			// Using mergeMap here ensures the resulting set of values will be emitted as a new stream.
			mergeMap( cartesianProduct ),
			// Then we apply the remaining operations to generate a row for each combination of dimension values.
			...ops
		)
		.subscribe( ( rows ) => {
			data.rows = rows;
			data.rowCount = rows.length;

			// We pretend that the first row contains minimums and the last one maximums because we don't
			// really need mathematically correct values and can simplify the process of finding this information.
			data.minimums = [
				{
					dimensionValues: dimensions.map( ( dimension ) => {
						if ( dimension === 'dateRange' ) {
							return { value: 'date_range_0' };
						}

						return {
							value: 'RESERVED_MIN',
						};
					} ),
					metricValues: [ ...( rows[ 0 ]?.metricValues || [] ) ],
				},
			].concat(
				hasDateRange
					? [
							{
								dimensionValues: dimensions.map(
									( dimension ) => {
										if ( dimension === 'dateRange' ) {
											return {
												value: 'date_range_1',
											};
										}

										return {
											value: 'RESERVED_MIN',
										};
									}
								),
								metricValues: [
									...( rows[ 1 ]?.metricValues || [] ),
								],
							},
					  ]
					: []
			);

			// For maximums and totals, if we have a date range the second to last row will be date_range_0 and the last row will be date_range_1.
			// When there is no date range we only need to use the last row.
			const firstItemIndex = rows.length - ( hasDateRange ? 2 : 1 );

			data.maximums = [
				{
					dimensionValues: dimensions.map( ( dimension ) => {
						if ( dimension === 'dateRange' ) {
							return { value: 'date_range_0' };
						}

						return {
							value: 'RESERVED_MAX',
						};
					} ),
					metricValues: [
						...( rows[ firstItemIndex ]?.metricValues || [] ),
					],
				},
			].concat(
				hasDateRange
					? [
							{
								dimensionValues: dimensions.map(
									( dimension ) => {
										if ( dimension === 'dateRange' ) {
											return {
												value: 'date_range_1',
											};
										}

										return {
											value: 'RESERVED_MAX',
										};
									}
								),
								metricValues: [
									...( rows[ rows.length - 1 ]
										?.metricValues || [] ),
								],
							},
					  ]
					: []
			);

			// Same here, we pretend that the last row contains totals because we don't need it to be mathematically valid.
			data.totals = [
				{
					dimensionValues: dimensions.map( ( dimension ) => {
						if ( dimension === 'dateRange' ) {
							return { value: 'date_range_0' };
						}

						return {
							value: 'RESERVED_TOTAL',
						};
					} ),
					metricValues: [
						...( rows[ firstItemIndex ]?.metricValues || [] ),
					],
				},
			].concat(
				hasDateRange
					? [
							{
								dimensionValues: dimensions.map(
									( dimension ) => {
										if ( dimension === 'dateRange' ) {
											return {
												value: 'date_range_1',
											};
										}

										return {
											value: 'RESERVED_TOTAL',
										};
									}
								),
								metricValues: [
									...( rows[ rows.length - 1 ]
										?.metricValues || [] ),
								],
							},
					  ]
					: []
			);
		} );

	// Set the original seed value for the faker.
	faker.seed( originalSeedValue );

	return {
		dimensionHeaders:
			args?.dimensions?.map( ( dimension ) => ( {
				name: dimension,
			} ) ) || null,
		metricHeaders: validMetrics.map( ( metric ) => ( {
			name: metric?.name || metric.toString(),
			type: getMetricType( metric ),
		} ) ),
		...data,
	};
}

/**
 * Generates mock response for Analytics 4 reports.
 *
 * @since n.e.x.t
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 * @param {Object}           options  Report options.
 */
export function provideAnalytics4MockReport( registry, options ) {
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( getAnalytics4MockResponse( options ), { options } );
}